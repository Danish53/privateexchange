import LegalLayout from '@/components/legal/LegalLayout';

export const metadata = {
  title: 'Privacy Policy · 759 Private Exchange',
  description: 'How 759 Private Exchange handles information in the demo workspace.',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="Last updated: April 7, 2026">
      <section>
        <h2>Introduction</h2>
        <p>
          This Privacy Policy describes how 759 Private Exchange (“we”, “us”) handles information in
          the current demo and preview environment. It is provided for transparency and should be
          replaced with counsel-reviewed language before any production launch.
        </p>
      </section>

      <section>
        <h2>Information you provide</h2>
        <p>
          When you create an account or use forms, you may provide identifiers such as an email
          address, display name, or phone number. You should only submit information you are
          permitted to share.
        </p>
      </section>

      <section>
        <h2>Local demo storage</h2>
        <p>
          In this build, sign-in state and profile fields may be stored in your browser (for example
          via localStorage) so the UI can be demonstrated without a live API. That data stays on
          your device unless you clear site data or use another browser.
        </p>
      </section>

      <section>
        <h2>When a backend is connected</h2>
        <p>
          A production deployment would typically process data on secure servers, apply retention
          rules, and integrate with your authentication provider. Those details will be documented
          here and in your product agreements before go-live.
        </p>
      </section>

      <section>
        <h2>Cookies and similar technologies</h2>
        <p>
          The application may use cookies or local storage for session continuity and preferences.
          You can control cookies through your browser settings.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <ul>
          <li>Update profile fields where the product allows it.</li>
          <li>Sign out and clear site data to remove local demo storage.</li>
          <li>Contact the operator if you need account deletion once a live service exists.</li>
        </ul>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For privacy questions related to a future production service, use the contact channel
          published on the official site once available.
        </p>
      </section>
    </LegalLayout>
  );
}
