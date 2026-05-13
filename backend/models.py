from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class UserRequest(BaseModel):
    user_query: str

class ExtractedRequirements(BaseModel):
    body_type: Optional[str] = None
    number_of_seats: Optional[int] = None
    safety_rating: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    price_min: Optional[int] = None
    price_max: Optional[int] = None
    use_case: Optional[str] = None
    priorities: Optional[List[str]] = None

class RecommendationResponse(BaseModel):
    requirements: ExtractedRequirements
    recommendations: List[Dict[str, Any]]
    count: int
    best_car: Optional[Dict[str, Any]] = None
    recommendation_statement: Optional[str] = None
