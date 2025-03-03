import React, { createContext, useContext, useState } from "react";

interface ExpressionContextType {
    expression: string;
    setExpression: (expression: string) => void;
}

const ExpressionContext = createContext<ExpressionContextType | undefined>(undefined);

export const ExpressionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [expression, setExpression] = useState<string>("Detecting...");

    return (
        <ExpressionContext.Provider value={{ expression, setExpression }}>
            {children}
        </ExpressionContext.Provider>
    );
};

export const useExpression = () => {
    const context = useContext(ExpressionContext);
    if (!context) {
        throw new Error("useExpression must be used within an ExpressionProvider");
    }
    return context;
};
