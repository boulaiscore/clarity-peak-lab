import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 px-6">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 23, 2024</p>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to NeuroLoop Pro, operated by SuperHuman Labs ("we," "our," or "us"). 
              We are committed to protecting your privacy and ensuring the security of your personal data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our cognitive training application and related services.
            </p>
          </section>

          {/* Data We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mt-6 mb-3">2.1 Account Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you create an account, we collect:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Email address</li>
              <li>Name (optional)</li>
              <li>Age and demographic information (optional)</li>
              <li>Training preferences and goals</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">2.2 Wearable Device Data (Garmin Connect)</h3>
            <p className="text-muted-foreground leading-relaxed">
              If you choose to connect your Garmin device, we may collect the following activity data 
              through the Garmin Connect API:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li><strong>Heart Rate Data:</strong> Resting heart rate, heart rate variability (HRV)</li>
              <li><strong>Sleep Data:</strong> Sleep duration, sleep stages, sleep efficiency scores</li>
              <li><strong>Stress Data:</strong> Stress levels and recovery metrics</li>
              <li><strong>Activity Data:</strong> Steps, active minutes, calories burned</li>
              <li><strong>Body Battery:</strong> Energy levels throughout the day</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">2.3 App Usage Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              We collect data about how you interact with our app:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Training session results and performance scores</li>
              <li>Cognitive metrics and progress over time</li>
              <li>Feature usage patterns</li>
              <li>Device information and app version</li>
            </ul>
          </section>

          {/* How We Use Data */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li><strong>Personalized Training:</strong> To tailor cognitive exercises based on your physiological state and readiness</li>
              <li><strong>Cognitive Insights:</strong> To provide insights about the relationship between your physical metrics and cognitive performance</li>
              <li><strong>Progress Tracking:</strong> To track and display your cognitive improvement over time</li>
              <li><strong>Service Improvement:</strong> To enhance our algorithms and user experience</li>
              <li><strong>Communication:</strong> To send you training reminders and important updates (with your consent)</li>
            </ul>
          </section>

          {/* Legal Basis */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Legal Basis for Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We process your personal data based on:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li><strong>Consent:</strong> You explicitly consent to data collection when connecting your Garmin device</li>
              <li><strong>Contract:</strong> Processing is necessary to provide you with our services</li>
              <li><strong>Legitimate Interest:</strong> To improve our services and ensure security</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>We do not sell your personal data to third parties.</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We may share your data only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li><strong>Service Providers:</strong> With trusted partners who help us operate our services (e.g., cloud hosting, analytics) under strict confidentiality agreements</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our legal rights</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement robust security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Encryption in transit (TLS/SSL) and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and monitoring</li>
              <li>Limited employee access to personal data</li>
              <li>Secure cloud infrastructure with industry-standard protections</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide services. 
              Wearable data is typically retained for up to 2 years to enable long-term progress tracking. 
              You may request deletion of your data at any time.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Withdraw Consent:</strong> Disconnect your Garmin account at any time</li>
              <li><strong>Object:</strong> Object to certain processing activities</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, please contact us using the information below.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our app integrates with third-party services including Garmin Connect. 
              When you connect these services, you are also subject to their respective privacy policies. 
              We encourage you to review:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li><a href="https://www.garmin.com/en-US/privacy/connect/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Garmin Connect Privacy Policy</a></li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not intended for individuals under 16 years of age. 
              We do not knowingly collect personal data from children. 
              If we become aware that we have collected data from a child, we will take steps to delete it.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. 
              We will notify you of any material changes by posting the new policy on this page 
              and updating the "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-foreground font-medium">SuperHuman Labs</p>
              <p className="text-muted-foreground">NeuroLoop Pro</p>
              <p className="text-muted-foreground mt-2">
                Email: <a href="mailto:privacy@neurolooplabs.com" className="text-primary hover:underline">privacy@neurolooplabs.com</a>
              </p>
              <p className="text-muted-foreground">
                Website: <a href="https://www.neurolooplabs.com" className="text-primary hover:underline">www.neurolooplabs.com</a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} SuperHuman Labs. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
