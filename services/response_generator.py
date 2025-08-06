from langchain_ollama import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import (
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    ChatPromptTemplate
)

class FastEmailResponseGenerator:
    def __init__(self, model_name: str = "mistral"):
        self.llm = ChatOllama(
            model=model_name,
            base_url="http://localhost:11434",
            temperature=0.3,
            max_tokens=150
        )
        
        self.emotion_system_prompt = SystemMessagePromptTemplate.from_template(
            "You are an expert in emotion analysis. Classify the given email "
            "into one of these emotions: joy, sadness, anger, neutral. Respond with only the category."
        )
        
        self.response_system_prompt = SystemMessagePromptTemplate.from_template(
            "You are an AI that generates professional, empathetic email responses. "
            "Ensure the response is concise and solution-focused."
        )

    async def generate_response(self, email_content: str):
        emotion_prompt = ChatPromptTemplate.from_messages([
            self.emotion_system_prompt,
            HumanMessagePromptTemplate.from_template("{email}")
        ])
        
        emotion_chain = emotion_prompt | self.llm | StrOutputParser()
        emotion = await emotion_chain.ainvoke({"email": email_content})
        
        response_prompt = ChatPromptTemplate.from_messages([
            self.response_system_prompt,
            HumanMessagePromptTemplate.from_template(
                f"Generate a professional response to this email. "
                f"The sender's emotional tone is {emotion}.\n\n"
                "Email: {email}\n\n"
                "1. Acknowledge the emotional state\n"
                "2. Address main concerns\n"
                "3. Provide clear solutions\n"
                "4. Keep it concise and professional"
            )
        ])
        
        response_chain = response_prompt | self.llm | StrOutputParser()
        response = await response_chain.ainvoke({"email": email_content})
        
        return {
            'emotion': emotion.strip().lower(),
            'response': response.strip()
        }