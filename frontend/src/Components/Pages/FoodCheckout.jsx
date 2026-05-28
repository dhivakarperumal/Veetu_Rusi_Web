import React from "react";
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "../CommenComponents/PageContainer";
import { useNavigate } from "react-router-dom";

export default function FoodCheckout() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Food Checkout" />
      <div className="min-h-screen bg-gray-50 py-16">
        <PageContainer>
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-xl font-semibold mb-4">Food Checkout (Fields will be added)</h2>
            <p className="text-gray-600 mb-6">This page is reserved for the user-food checkout flow. You can provide the required fields and I will wire them up.</p>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-lg border"
              >
                Back
              </button>

              <button
                onClick={() => alert('Checkout action placeholder')}
                className="px-4 py-2 rounded-lg bg-primary text-white"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </PageContainer>
      </div>
    </>
  );
}
