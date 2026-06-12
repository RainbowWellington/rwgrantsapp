import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Shield, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Grants Portal</h1>
          <Link
            to="/login"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Community Grants Program
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Apply for funding to support projects and events that strengthen and
            uplift our community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
            <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Apply for a Grant
            </h3>
            <p className="text-gray-600 mb-6 flex-1">
              Submit your application online. Tell us about your project, its
              impact on the community, and how the funding will be used.
            </p>
            <Link
              to="/apply"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start Application
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
            <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Admin Portal
            </h3>
            <p className="text-gray-600 mb-6 flex-1">
              Manage applications, update statuses, add comments, and oversee
              the grants review process.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Admin Login
              <Shield className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Embed This Form
          </h3>
          <p className="text-gray-600 mb-4">
            You can embed the grant application form on your website using the
            following code:
          </p>
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 overflow-x-auto">
            {`<iframe
  src="${typeof window !== "undefined" ? window.location.origin : "https://your-site.netlify.app"}/apply"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; max-width: 800px;"
></iframe>`}
          </pre>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 mt-16">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
          Grants Portal &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
