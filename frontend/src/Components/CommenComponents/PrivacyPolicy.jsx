import PageHeader from "../CommenComponents/PageHeader";

const PrivacyPolicy = () => {
  return (
    <>
      <PageHeader title="Privacy Policy" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-700 leading-relaxed space-y-8">
        <section>
          <h1 className="text-3xl font-bold text-primary-dark mb-4">
            Privacy Policy
          </h1>

          <p className="text-sm text-gray-500 mb-4">
            Last Updated: August 28, 2026
          </p>

          <p>
            Veetu Rusi respects your privacy. This Privacy Policy explains how
            we collect, use, store, and protect information when you use our
            website, mobile application, and related services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
          <p>
            We may collect information you provide when you create an account,
            place an order, contact support, or use our services.
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Name, email address, phone number, and account credentials.</li>
            <li>Delivery address, saved addresses, and location information.</li>
            <li>Order details, preferences, reviews, and support messages.</li>
            <li>Payment and transaction details processed through payment providers.</li>
            <li>Device, browser, usage, and diagnostic information.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. How We Use Information</h2>
          <p>We use information to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Create and manage your account.</li>
            <li>Process orders, payments, cancellations, and refunds.</li>
            <li>Coordinate delivery and provide customer support.</li>
            <li>Improve our platform, products, and service quality.</li>
            <li>Send service updates, order notifications, and relevant offers.</li>
            <li>Prevent fraud, protect platform security, and meet legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Sharing of Information</h2>
          <p>
            We share information only when necessary to provide our services.
            This may include sharing relevant order and delivery details with
            home chefs, franchise administrators, delivery partners, payment
            providers, technology vendors, and customer support providers.
          </p>
          <p className="mt-2">
            We may also disclose information when required by law, to protect
            our rights and users, or as part of a business transfer. We do not
            sell your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Payments</h2>
          <p>
            Payments are handled by authorized third-party payment providers.
            Veetu Rusi does not store complete card numbers or payment
            authentication credentials. Payment providers may process your
            information under their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Cookies and Similar Technologies</h2>
          <p>
            We may use cookies and similar technologies to keep you signed in,
            remember preferences, understand usage, and improve performance.
            You can manage cookies through your browser settings, although some
            features may not work correctly when they are disabled.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Data Retention and Security</h2>
          <p>
            We retain information only for as long as necessary for the purposes
            described in this policy, including legal, accounting, dispute
            resolution, and fraud prevention requirements.
          </p>
          <p className="mt-2">
            We use reasonable administrative, technical, and organizational
            safeguards to protect personal information. No online service can
            guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Your Choices and Rights</h2>
          <p>
            You may review or update account information, manage communication
            preferences, and request deletion of your account by contacting us.
            Some information may need to be retained where required by law or
            necessary to complete an outstanding transaction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. Children&apos;s Privacy</h2>
          <p>
            Our services are not directed to children who are unable to enter
            into a legally binding agreement. We do not knowingly collect
            personal information from such children.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">9. Third-Party Links</h2>
          <p>
            Our platform may contain links to third-party websites or services.
            Their privacy practices are governed by their own policies, and we
            encourage you to review them before sharing information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The revised
            policy will be posted on this page with an updated date. Continued
            use of our services after an update means you acknowledge the
            revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">11. Contact Us</h2>
          <p>
            For privacy questions or requests, contact Veetu Rusi at
            support@mystore.com or +91 98765 43210.
          </p>
        </section>
      </main>
    </>
  );
};

export default PrivacyPolicy;
