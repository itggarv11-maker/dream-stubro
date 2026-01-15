
import React from 'react';
import Card from '../components/common/Card';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800">Privacy Policy</h1>
        <p className="mt-2 text-lg text-slate-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <Card variant="light" className="!p-8">
        <div className="prose max-w-none text-slate-700">
          <p>
            Welcome to StuBro AI ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
          </p>

          <h2 className="text-slate-800">1. Information We Collect</h2>
          <p>
            We may collect information about you in a variety of ways. The information we may collect via the Application includes:
          </p>
          <ul>
            <li>
              <strong>Personal Data:</strong> Personally identifiable information, such as your email address, that you voluntarily give to us when you register with the Application.
            </li>
            <li>
              <strong>User Content:</strong> Text, documents, and other content you upload or paste into the service for processing by our AI tools. We use this content solely to provide the service and do not store it permanently after processing is complete, except for features like quiz history which are stored locally on your device or tied to your account.
            </li>
             <li>
              <strong>Derivative Data:</strong> Information our servers automatically collect when you access the Application, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Application. (This is a standard practice for most web services).
            </li>
          </ul>

          <h2 className="text-slate-800">2. Use of Your Information</h2>
          <p>
            Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:
          </p>
          <ul>
            <li>Create and manage your account.</li>
            <li>Provide you with the AI-powered services you request.</li>
            <li>Improve the functionality and quality of our service.</li>
            <li>Monitor and analyze usage and trends to improve your experience with the Application.</li>
            <li>Respond to your comments and questions and provide customer service.</li>
          </ul>
          
           <h2 className="text-slate-800">3. Third-Party Services</h2>
          <p>
            We use Google's Gemini API to power our AI features. The content you submit (like text for summarization or questions for quizzes) is sent to Google's servers for processing. We encourage you to review Google's API Privacy Policy. We do not share your personal registration information (like your email) with Google as part of these API calls.
          </p>

          <h2 className="text-slate-800">4. Security of Your Information</h2>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
          </p>

          <h2 className="text-slate-800">5. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please contact us through the contact form on our website.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;