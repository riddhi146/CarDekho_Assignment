from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import UserRequest, RecommendationResponse, ExtractedRequirements
from gemini_client import get_gemini_client
from recommendation_engine import RecommendationEngine
import json
import re

app = FastAPI(title="Car Recommendation API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
gemini_client = get_gemini_client()
recommendation_engine = RecommendationEngine()

# Store last extracted requirements (in production, use database/session)
last_requirements: ExtractedRequirements = None

@app.post("/recommend-cars")
async def recommend_cars(request: UserRequest):
    """Extract car requirements from user query using Gemini"""
    global last_requirements
    
    # Create prompt for Gemini
    prompt = f"""
You are a car recommendation assistant. Extract the car requirements from the user's query and return them as JSON.

User query: "{request.user_query}"

Extract the following parameters if mentioned:
- body_type: Hatchback, Sedan, SUV, MUV, Coupe (string)
- number_of_seats: minimum number of seats required (integer)
- safety_rating: minimum safety rating required (integer, 1-5)
- fuel_type: Petrol, Diesel, Electric, CNG (string)
- transmission: Manual, Automatic, AMT (string)
- price_min: minimum budget in rupees (integer)
- price_max: maximum budget in rupees (integer)
- use_case: city, highway, family, off-road (string)
- priorities: list of priorities like ["mileage", "safety", "performance", "features"] (array of strings)

Return ONLY valid JSON. If a parameter is not mentioned, set it to null.
Example output format:
{{
  "body_type": "SUV",
  "number_of_seats": 5,
  "safety_rating": 4,
  "fuel_type": null,
  "transmission": "Automatic",
  "price_min": null,
  "price_max": 1500000,
  "use_case": "family",
  "priorities": ["safety", "mileage"]
}}
"""
    
    try:
        response = gemini_client.generate_json_response(prompt)
        
        # Extract JSON from response (handle markdown code blocks if present)
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            json_str = json_match.group()
        else:
            json_str = response
        
        requirements_dict = json.loads(json_str)
        
        # Create ExtractedRequirements object
        last_requirements = ExtractedRequirements(**requirements_dict)
        
        return {
            "status": "success",
            "message": "Requirements extracted successfully",
            "requirements": last_requirements.dict()
        }
    
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse Gemini response as JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.get("/recommendations")
async def get_recommendations():
    """Get car recommendations based on extracted requirements"""
    global last_requirements
    
    if last_requirements is None:
        raise HTTPException(
            status_code=400, 
            detail="No requirements found. Please call /recommend-cars first."
        )
    
    try:
        recommendations = recommendation_engine.get_recommendations(last_requirements, limit=3)
        
        # Remove score from response (it's internal)
        for car in recommendations:
            car.pop("score", None)
        
        # Identify best car (first one has highest score)
        best_car = recommendations[0] if recommendations else None
        
        # Generate recommendation statement with pros and cons using Gemini
        recommendation_statement = None
        if best_car:
            prompt = f"""
You are a car recommendation assistant. Based on the user's requirements and the recommended car, provide a concise recommendation statement with pros and cons.

User requirements:
- Body type: {last_requirements.body_type or 'Not specified'}
- Number of seats: {last_requirements.number_of_seats or 'Not specified'}
- Safety rating: {last_requirements.safety_rating or 'Not specified'}
- Fuel type: {last_requirements.fuel_type or 'Not specified'}
- Transmission: {last_requirements.transmission or 'Not specified'}
- Price range: {last_requirements.price_min or 'Not specified'} - {last_requirements.price_max or 'Not specified'}
- Use case: {last_requirements.use_case or 'Not specified'}
- Priorities: {last_requirements.priorities or 'Not specified'}

Best suited car:
- Name: {best_car.get('name', 'Unknown')}
- Brand: {best_car.get('brand', 'Unknown')}
- Body type: {best_car.get('body_type', 'Unknown')}
- Price: ₹{best_car.get('price', 'Unknown')}
- Mileage: {best_car.get('mileage', 'Unknown')}
- Safety rating: {best_car.get('safety_rating', 'Unknown')}
- Number of seats: {best_car.get('number_of_seats', 'Unknown')}
- Transmission: {best_car.get('specs', {}).get('transmission', 'Unknown')}
- Fuel type: {best_car.get('specs', {}).get('fuel_type', 'Unknown')}
- Power: {best_car.get('specs', {}).get('power', 'Unknown')}

Provide a recommendation statement (2-3 sentences) explaining why this car is best suited for the user, followed by:
- Pros: List 3-5 key advantages
- Cons: List 2-3 potential drawbacks

Keep the response concise and practical.
"""
            try:
                recommendation_statement = gemini_client.generate_response(prompt)
            except Exception as e:
                # If Gemini fails, provide a fallback statement
                recommendation_statement = f"Based on your requirements, the {best_car.get('brand', '')} {best_car.get('name', '')} is the best suited car. It offers a good balance of features matching your needs."
        
        return RecommendationResponse(
            requirements=last_requirements,
            recommendations=recommendations,
            count=len(recommendations),
            best_car=best_car,
            recommendation_statement=recommendation_statement
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Car Recommendation API",
        "endpoints": {
            "POST /recommend-cars": "Extract car requirements from user query",
            "GET /recommendations": "Get car recommendations based on extracted requirements"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
