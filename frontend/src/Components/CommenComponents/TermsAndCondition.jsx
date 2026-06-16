import React from "react";
import PageHeader from "../CommenComponents/PageHeader";

const TermsAndConditions = () => {
  return (
    <>
      <PageHeader title="Terms & Conditions" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-700 leading-relaxed space-y-8">

        <section>
          <h1 className="text-3xl font-bold text-primary-dark mb-4">
            Terms & Conditions
          </h1>

          <p className="text-sm text-gray-500 mb-4">
            Last Updated: June 16, 2026
          </p>

          <p>
            Welcome to Veetu Rusi. By accessing or using our platform,
            website, or mobile application, you agree to comply with these
            Terms & Conditions. These terms govern the relationship between
            customers, franchise administrators, home chefs, delivery partners,
            and platform administrators.
          </p>

          <p className="mt-3">
            Veetu Rusi is a technology platform that connects customers with
            home chefs through a franchise-based food delivery network.
            If you do not agree with these terms, please discontinue using
            the platform.
          </p>
        </section>

        {/* Platform Overview */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            1. Platform Overview
          </h2>

          <p>
            Veetu Rusi operates through a structured network:
          </p>

          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Super Admin manages the entire platform.</li>
            <li>Franchise Admin manages operations within assigned regions.</li>
            <li>Home Chefs prepare and fulfill food orders.</li>
            <li>Delivery Partners deliver food to customers.</li>
            <li>Customers place orders through the platform.</li>
          </ul>

          <p className="mt-2">
            Veetu Rusi facilitates ordering, payment processing,
            and delivery coordination.
          </p>
        </section>

        {/* User Accounts */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            2. User Registration & Accounts
          </h2>

          <p>
            Users may create an account to place orders, track deliveries,
            and manage preferences.
          </p>

          <p className="mt-2">
            Users are responsible for maintaining the confidentiality of
            their login credentials and for all activities performed through
            their accounts.
          </p>
        </section>

        {/* Ordering Food */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            3. Food Ordering
          </h2>

          <p>
            Customers can browse available food items, place orders,
            and make payments through approved payment methods.
          </p>

          <p className="mt-2">
            Orders are considered confirmed only after successful payment
            verification or order acceptance by the platform.
          </p>
        </section>

        {/* Home Chef */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            4. Home Chef Responsibilities
          </h2>

          <p>
            Home chefs registered on the platform are responsible for:
          </p>

          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Preparing food hygienically and safely.</li>
            <li>Using quality ingredients.</li>
            <li>Providing accurate menu information.</li>
            <li>Completing accepted orders on time.</li>
            <li>Complying with food safety regulations.</li>
          </ul>
        </section>

        {/* Franchise Admin */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            5. Franchise Admin Responsibilities
          </h2>

          <p>
            Franchise administrators are responsible for managing
            operational activities within their assigned region.
          </p>

          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Managing home chefs.</li>
            <li>Managing delivery personnel.</li>
            <li>Monitoring service quality.</li>
            <li>Ensuring compliance with platform policies.</li>
          </ul>
        </section>

        {/* Delivery Partner */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            6. Delivery Partner Responsibilities
          </h2>

          <p>
            Delivery partners are responsible for collecting food orders
            and delivering them safely to customers.
          </p>

          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Maintaining professionalism.</li>
            <li>Ensuring timely delivery.</li>
            <li>Handling food with care.</li>
            <li>Protecting customer privacy.</li>
          </ul>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            7. Pricing & Payments
          </h2>

          <p>
            All prices displayed on the platform are in Indian Rupees (₹)
            unless otherwise specified.
          </p>

          <p className="mt-2">
            Prices, taxes, and delivery charges may change without prior notice.
            Payment must be completed through approved payment methods.
          </p>
        </section>

        {/* Cancellation */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            8. Order Cancellation
          </h2>

          <p>
            Customers may cancel an order before food preparation begins.
          </p>

          <p className="mt-2">
            Once food preparation has started, cancellations may not be
            eligible for refunds.
          </p>

          <p className="mt-2">
            Veetu Rusi reserves the right to cancel orders due to
            product unavailability, technical issues, payment failures,
            or suspected fraudulent activity.
          </p>
        </section>

        {/* Refund */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            9. Refund Policy
          </h2>

          <p>
            Refunds may be issued in the following circumstances:
          </p>

          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Order not delivered.</li>
            <li>Duplicate payment.</li>
            <li>Wrong item delivered.</li>
            <li>Verified food quality issues.</li>
          </ul>

          <p className="mt-2">
            Approved refunds are generally processed within 5–7 business days.
          </p>
        </section>

        {/* Delivery */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            10. Delivery Policy
          </h2>

          <p>
            Delivery times are estimates and may vary due to traffic,
            weather conditions, operational delays, or high demand.
          </p>

          <p className="mt-2">
            Customers must ensure that delivery information is accurate
            and that someone is available to receive the order.
          </p>
        </section>

        {/* Food Safety */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            11. Food Quality & Safety
          </h2>

          <p>
            Home chefs are responsible for maintaining food quality,
            hygiene, and ingredient standards.
          </p>

          <p className="mt-2">
            Customers are encouraged to review ingredient information
            and disclose food allergies where applicable.
          </p>
        </section>

        {/* User Conduct */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            12. User Conduct
          </h2>

          <p>
            Users shall not:
          </p>

          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide false information.</li>
            <li>Attempt unauthorized access to the platform.</li>
            <li>Engage in fraudulent transactions.</li>
            <li>Harass chefs, delivery partners, or staff.</li>
            <li>Misuse platform services.</li>
          </ul>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            13. Privacy Policy
          </h2>

          <p>
            Customer information is collected only for order processing,
            delivery, customer support, and service improvement.
          </p>

          <p className="mt-2">
            We do not sell personal information to third parties.
          </p>
        </section>

        {/* Intellectual Property */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            14. Intellectual Property
          </h2>

          <p>
            All content including logos, images, designs, software,
            trademarks, and text belongs to Veetu Rusi and is protected
            under applicable intellectual property laws.
          </p>
        </section>

        {/* Limitation */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            15. Limitation of Liability
          </h2>

          <p>
            Veetu Rusi acts as a platform connecting customers,
            franchise administrators, home chefs, and delivery partners.
          </p>

          <p className="mt-2">
            We shall not be liable for delays, interruptions,
            incorrect customer information, or circumstances beyond our control.
          </p>
        </section>

        {/* Suspension */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            16. Suspension & Termination
          </h2>

          <p>
            Veetu Rusi reserves the right to suspend or terminate
            any account found violating platform policies,
            legal requirements, or ethical standards.
          </p>
        </section>

        {/* Changes */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            17. Changes to Terms
          </h2>

          <p>
            We reserve the right to update or modify these Terms &
            Conditions at any time without prior notice.
          </p>

          <p className="mt-2">
            Continued use of the platform constitutes acceptance of
            the updated terms.
          </p>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            18. Governing Law
          </h2>

          <p>
            These Terms & Conditions shall be governed by the laws of India.
            Any disputes arising from the use of the platform shall be
            subject to the jurisdiction of the courts of Tamil Nadu.
          </p>
        </section>

      </div>
    </>
  );
};

export default TermsAndConditions;