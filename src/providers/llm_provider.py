from __future__ import annotations  
from abc import ABC, abstractmethod  
from dataclasses import dataclass  
from typing import List, Optional  
  
  
@dataclass  
class LLMResponse:  
    text: str  
    confidence: Optional[float] = None  
  
  
class LLMProvider(ABC):  
    """Abstract base class for LLM providers."""  
  
    @abstractmethod  
    def generate_text(self, prompt: str, max_tokens: int) - 
        """Generates text based on the given prompt."""  
        pass  
  
    @abstractmethod  
    def generate_patch(self, context: str, error_message: str) - 
        """Generates a code patch based on the given context and error message."""  
        pass 
