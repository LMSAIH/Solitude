from fastapi import APIRouter, Request, HTTPException, Response, Query
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from openai import AsyncOpenAI
import json
import asyncio
from typing import Dict, List, Optional
import time
from dotenv import load_dotenv
import os

load_dotenv()


OPENAIKEY = os.getenv("OPENAIKEY")

if not OPENAIKEY:
    raise ValueError("No AI key provided")

router = APIRouter()



conversation_cache: Dict[str, List[Dict]] = {}

client = AsyncOpenAI(api_key=OPENAIKEY)

async def generate_response_stream(emotion: str, conversation_id: str, message: str, personality: str):
    """Generate streaming responses from GPT based on emotion and conversation history"""
    
    messages = conversation_cache.get(conversation_id, [])
    
    system_message = f"You are an AI assistant. The user is feeling {emotion}, you don't have to mention it, just act according to the emotion the user is currently feeling. Act like a human that has a {personality} personality "
    
    api_messages = [
        {"role": "system", "content": system_message}
    ]
    
    api_messages.extend(messages[-10:])
    
    api_messages.append({"role": "user", "content": message})
    
    try:
        stream = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=api_messages,
            stream=True,
            max_tokens=500
        )
        
        full_response = ""
        
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_response += content
                yield {
                    "event": "message",
                    "data": content
                }
                
                await asyncio.sleep(0.01)
        
        messages.append({"role": "user", "content": message})
        messages.append({"role": "assistant", "content": full_response})
        conversation_cache[conversation_id] = messages
        
        yield {
            "event": "complete",
            "data": "Message transmission complete"
        }
            
    except Exception as e:
        yield {
            "event": "error",
            "data": f"Error generating response: {str(e)}"
        }

@router.api_route('/get_response', methods=['POST', 'GET'])
async def get_response(
    request: Request,
    emotion: Optional[str] = Query(None),
    personality: Optional[str] = Query(None),
    message: Optional[str] = Query(None),
    conversation_id: Optional[str] = Query(None)
):
    """
    Server-Sent Events endpoint for emotion-based AI responses
    Supports both POST with JSON body and GET with query parameters
    """
    try:
        if request.method == 'POST':
            data = await request.json()
            emotion = data.get("emotion")
            personality = data.get("personality")
            message = data.get("message")
            conversation_id = data.get("conversation_id", str(time.time()))
        else:
            conversation_id = conversation_id or str(time.time())
        
        if not emotion:
            raise HTTPException(status_code=400, detail="Emotion is required")
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        if not personality:
            personality = "friendly"  
      
        return EventSourceResponse(
            generate_response_stream(emotion, conversation_id, message, personality),
            media_type="text/event-stream"
        )
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete('/clear_conversation/{conversation_id}')
async def clear_conversation(conversation_id: str):
    if conversation_id in conversation_cache:
        del conversation_cache[conversation_id]
        return {"message": f"Conversation {conversation_id} cleared"}
    raise HTTPException(status_code=404, detail="Conversation not found")