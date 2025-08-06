from langchain_ollama import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import (
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    ChatPromptTemplate
)
import random

class ResponsePredictor:
    def __init__(self, model_name: str = "mistral"):
        self.llm = ChatOllama(
            model=model_name,
            base_url="http://localhost:11434",
            temperature=0.7,  # Higher temperature for more varied predictions
            max_tokens=200
        )
        
        self.system_prompt = SystemMessagePromptTemplate.from_template(
            "You are an expert in email communication and human behavior. "
            "Based on an original email and the response sent, predict the most likely reply "
            "that the recipient might send back. Consider the context, tone, and content of both emails."
        )

    async def predict_reply(self, original_email: str, our_response: str):
        """Predict possible responses from the recipient based on original email and our response."""
        
        predict_prompt = ChatPromptTemplate.from_messages([
            self.system_prompt,
            HumanMessagePromptTemplate.from_template(
                "Original email:\n{original_email}\n\n"
                "Our response:\n{our_response}\n\n"
                "Predict the most likely reply the recipient might send back. "
                "Consider the tone, content, and context. Also provide a percentage "
                "indicating the likelihood of receiving any reply (from 0-100%)."
            )
        ])
        
        predict_chain = predict_prompt | self.llm | StrOutputParser()
        prediction = await predict_chain.ainvoke({
            "original_email": original_email,
            "our_response": our_response
        })
        
        # Extract the reply probability
        # This is a simplified approach - you could use a more sophisticated parser
        probability = self._extract_probability(prediction)
        
        return {
            'predicted_reply': prediction.strip(),
            'reply_probability': probability
        }
    
    def _extract_probability(self, text):
        """Extract probability from the prediction text or generate one if not found."""
        # Try to find a percentage in the text
        import re
        percentage_match = re.search(r'(\d{1,3})%', text)
        
        if percentage_match:
            try:
                probability = int(percentage_match.group(1))
                # Ensure it's within 0-100 range
                return min(max(probability, 0), 100)
            except:
                pass
        
        # If no valid percentage found, generate a reasonable one
        # More likely to be in 60-90 range since most business emails get replies
        return random.randint(60, 90)