import LegalLayout from '@/components/legal/LegalLayout';

export const metadata = {
  title: 'Terms of Service · 759 Private Exchange',
  description: 'Terms governing use of the 759 Private Exchange demo workspace.',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="Last updated: April 7, 2026">
      <section>
        <h2>Agreement</h2>
        <p>
          By accessing or using 759 Private Exchange (the “Service”), you agree to these Terms of
          Service. If you do not agree, do not use the Service. This text is demo copy and must be
          reviewed by legal counsel before production.
        </p>
      </section>

      <section>
        <h2>Eligibility</h2>
        <p>
          You represent that you are of legal age to enter a binding agreement in your jurisdiction
          and that your use of the Service complies with applicable laws and sanctions rules.
        </p>
      </section>

      <section>
        <h2>Demo and preview</h2>
        <p>
          The Service may run in preview or demonstration mode. Balances, transfers, drawings, and
          fees shown may be illustrative. Nothing on this site constitutes financial, investment, or
          legal advice.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <p>
          You are responsible for safeguarding credentials and for activity under your account.
          Notify the operator of unauthorized use when a production support channel exists.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>No unlawful, fraudulent, or abusive activity.</li>
          <li>No attempt to disrupt, probe, or reverse engineer the Service beyond permitted testing.</li>
          <li>No use that infringes third-party rights.</li>
        </ul>
      </section>

      <section>
        <h2>Fees</h2>
        <p>
          Fee schedules, VIP rules, and waivers will be published in the product and may change.
          Displayed amounts in demo mode are not binding.
        </p>
      </section>

      <section>
        <h2>Disclaimer</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR
          IMPLIED, TO THE MAXIMUM EXTENT PERMITTED BY LAW.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR DATA,
          ARISING FROM YOUR USE OF THE SERVICE.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these Terms. Continued use after changes constitutes acceptance of the
          revised Terms where permitted by law.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For questions about these Terms once a production service is live, use the official
          contact method published on the site.
        </p>
      </section>
    </LegalLayout>
  );
}
