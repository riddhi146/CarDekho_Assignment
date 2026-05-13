"use client";

import { useState } from "react";

interface Requirements {
  body_type: string | null;
  number_of_seats: number | null;
  safety_rating: number | null;
  fuel_type: string | null;
  transmission: string | null;
  price_min: number | null;
  price_max: number | null;
  use_case: string | null;
  priorities: string[];
}

interface CarSpecs {
  engine: string;
  transmission: string;
  fuel_type: string;
  power: string;
  torque: string;
}

interface UserReview {
  rating: number;
  comment: string;
}

interface Car {
  make: string;
  model: string;
  variant: string;
  price: number;
  specs: CarSpecs;
  mileage: string;
  safety_rating: number;
  user_reviews: UserReview[];
  body_type: string;
  number_of_seats: number;
}

interface RecommendationsResponse {
  requirements: Requirements;
  recommendations: Car[];
  count: number;
  best_car: Car;
  recommendation_statement: string;
}

export default function Home() {
  const [userQuery, setUserQuery] = useState("");
  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [recommendations, setRecommendations] = useState<Car[] | null>(null);
  const [bestCar, setBestCar] = useState<Car | null>(null);
  const [recommendationStatement, setRecommendationStatement] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "confirm" | "results">("input");

  // const API_BASE_URL = "http://localhost:8000";
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleRecommendCar = async () => {
    if (!userQuery.trim()) {
      setError("Please enter your car requirements");
      return;
    }

    setLoading(true);
    setError(null);
    console.log("Calling /recommend-car API with:", userQuery);

    try {
      const response = await fetch(`${API_BASE_URL}/recommend-cars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_query: userQuery }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to get recommendations");
      }

      const data = await response.json();
      console.log("Response data:", data);
      setRequirements(data.requirements);
      setStep("confirm");
    } catch (err) {
      setError("Failed to process your request. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = async () => {
    setLoading(true);
    setError(null);
    console.log("Calling /recommendations API with:", requirements);

    try {
      const response = await fetch(`${API_BASE_URL}/recommendations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // body: JSON.stringify({ requirements }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to get recommendations");
      }

      const data: RecommendationsResponse = await response.json();
      console.log("Response data:", data);
      setRecommendations(data.recommendations);
      setBestCar(data.best_car);
      setRecommendationStatement(data.recommendation_statement);
      setStep("results");
    } catch (err) {
      setError("Failed to get recommendations. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUserQuery("");
    setRequirements(null);
    setRecommendations(null);
    setBestCar(null);
    setRecommendationStatement("");
    setError(null);
    setStep("input");
  };

  const formatPrice = (price: number) => {
    return `₹${(price / 100000).toFixed(2)} Lakhs`;
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🚗 CarDekho AI
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Find your perfect car with AI-powered recommendations
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Input Form */}
        {step === "input" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Tell us about your dream car
            </h2>
            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="e.g., I want to buy a sedan car for a family of 5 and city drive. My budget is around 15 to 20 lakhs"
              className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              disabled={loading}
            />
            <button
              onClick={handleRecommendCar}
              disabled={loading}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Get Recommendations"}
            </button>
          </div>
        )}

        {/* Step 2: Confirm Requirements */}
        {step === "confirm" && requirements && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Confirm Your Requirements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Body Type</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {requirements.body_type || "Not specified"}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Number of Seats</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {requirements.number_of_seats || "Not specified"}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Budget Range</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {requirements.price_min && requirements.price_max
                    ? `${formatPrice(requirements.price_min)} - ${formatPrice(requirements.price_max)}`
                    : "Not specified"}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Use Case</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {requirements.use_case || "Not specified"}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Fuel Type</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {requirements.fuel_type || "Not specified"}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Transmission</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {requirements.transmission || "Not specified"}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Safety Rating</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {requirements.safety_rating || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleProceed}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Proceed to Recommendations"}
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Recommendations */}
        {step === "results" && recommendations && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Recommended Cars ({recommendations.length})
              </h2>
              <button
                onClick={handleReset}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Start Over
              </button>
            </div>

            {/* Best Car Section */}
            {bestCar && (
              <div className="mb-10">
                <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-white/10 backdrop-blur-sm p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">🏆</span>
                      <h3 className="text-2xl font-bold text-white">
                        Best Match for You
                      </h3>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6">
                          <h3 className="text-3xl font-bold text-white mb-2">
                            {bestCar.make} {bestCar.model}
                          </h3>
                          <p className="text-blue-100 text-lg">{bestCar.variant}</p>
                          <p className="text-3xl font-bold text-white mt-4">
                            {formatPrice(bestCar.price)}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Engine:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {bestCar.specs.engine}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Transmission:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {bestCar.specs.transmission}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Fuel Type:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {bestCar.specs.fuel_type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Power:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {bestCar.specs.power}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Torque:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {bestCar.specs.torque}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Mileage:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {bestCar.mileage}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Safety Rating:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {renderStars(bestCar.safety_rating)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Seats:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {bestCar.number_of_seats}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Why This Car?
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                          <div className="prose dark:prose-invert max-w-none">
                            {recommendationStatement.split('\n').map((line, index) => {
                              if (line.trim().startsWith('**Pros:**')) {
                                return (
                                  <div key={index} className="mt-4">
                                    <h5 className="font-semibold text-green-600 dark:text-green-400 mb-2">{line.trim()}</h5>
                                  </div>
                                );
                              } else if (line.trim().startsWith('**Cons:**')) {
                                return (
                                  <div key={index} className="mt-4">
                                    <h5 className="font-semibold text-red-600 dark:text-red-400 mb-2">{line.trim()}</h5>
                                  </div>
                                );
                              } else if (line.trim().startsWith('*')) {
                                return (
                                  <li key={index} className="ml-4 text-gray-700 dark:text-gray-300">
                                    {line.trim().replace(/^\*\s*/, '')}
                                  </li>
                                );
                              } else if (line.trim()) {
                                return (
                                  <p key={index} className="text-gray-700 dark:text-gray-300 mb-2">
                                    {line}
                                  </p>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Recommendations */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Other Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((car, index) => {
                const isBestCar = bestCar && car.make === bestCar.make && car.model === bestCar.model && car.variant === bestCar.variant;
                if (isBestCar) return null;
                
                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
                  >
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                      <h3 className="text-2xl font-bold text-white">
                        {car.make} {car.model}
                      </h3>
                      <p className="text-blue-100">{car.variant}</p>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(car.price)}
                        </span>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {car.body_type}
                        </span>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Engine:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {car.specs.engine}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Transmission:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {car.specs.transmission}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Fuel Type:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {car.specs.fuel_type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Power:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {car.specs.power}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Torque:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {car.specs.torque}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Mileage:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {car.mileage}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Safety Rating:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {renderStars(car.safety_rating)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Seats:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {car.number_of_seats}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          User Reviews
                        </h4>
                        <div className="space-y-2">
                          {car.user_reviews.map((review, reviewIndex) => (
                            <div
                              key={reviewIndex}
                              className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-yellow-500">
                                  {renderStars(review.rating)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {review.comment}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
