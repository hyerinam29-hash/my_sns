import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      {/* Main Container */}
      <div className="w-full max-w-sm mx-auto">
        {/* Instagram Logo */}
        <div className="text-center mb-8">
          <h1
            className="text-5xl font-normal text-gray-900 tracking-tight"
            style={{
              fontFamily: '"Instagram Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontWeight: '400',
              letterSpacing: '0.01em'
            }}
          >
            Instagram
          </h1>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-gray-300 rounded-sm p-10">
          {/* Clerk SignIn Component */}
          <SignIn
            afterSignInUrl="/"
            signUpUrl="/sign-up"
            appearance={{
              baseTheme: undefined,
              variables: {
                colorPrimary: "#0095f6",
                colorBackground: "#ffffff",
                colorInputBackground: "#fafafa",
                colorInputText: "#262626",
                colorText: "#262626",
                borderRadius: "3px",
                fontFamily: '"Instagram Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              },
              elements: {
                card: {
                  border: "none",
                  borderRadius: "0",
                  boxShadow: "none",
                  padding: "0",
                  margin: "0",
                  width: "100%",
                },
                header: {
                  display: "none",
                },
                headerTitle: {
                  display: "none",
                },
                headerSubtitle: {
                  display: "none",
                },
                formButtonPrimary: {
                  backgroundColor: "#0095f6",
                  border: "none",
                  borderRadius: "4px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  height: "30px",
                  width: "100%",
                  marginTop: "8px",
                  marginBottom: "8px",
                  "&:hover": {
                    backgroundColor: "#008ae6",
                  },
                  "&:active": {
                    backgroundColor: "#0077cc",
                  },
                },
                socialButtonsBlockButton: {
                  border: "1px solid #dbdbdb",
                  borderRadius: "4px",
                  backgroundColor: "#0095f6",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  height: "28px",
                  width: "100%",
                  marginBottom: "8px",
                  "&:hover": {
                    backgroundColor: "#008ae6",
                  },
                },
                socialButtonsBlockButton__google: {
                  backgroundColor: "#ffffff",
                  border: "1px solid #dbdbdb",
                  color: "#262626",
                  "&:hover": {
                    backgroundColor: "#fafafa",
                  },
                },
                socialButtonsBlockButton__facebook: {
                  backgroundColor: "#1877f2",
                  border: "1px solid #1877f2",
                  color: "#ffffff",
                  "&:hover": {
                    backgroundColor: "#166fe5",
                  },
                },
                formFieldInput: {
                  border: "1px solid #dbdbdb",
                  borderRadius: "3px",
                  backgroundColor: "#fafafa",
                  color: "#262626",
                  fontSize: "12px",
                  height: "36px",
                  padding: "9px 0 7px 8px",
                  width: "100%",
                  marginBottom: "6px",
                  "&:focus": {
                    borderColor: "#b3b3b3",
                    backgroundColor: "#ffffff",
                  },
                  "&::placeholder": {
                    color: "#8e8e8e",
                  },
                },
                formFieldLabel: {
                  display: "none",
                },
                formField: {
                  marginBottom: "6px",
                },
                footerActionText: {
                  color: "#0095f6",
                  fontSize: "14px",
                  fontWeight: "600",
                  textDecoration: "none",
                  margin: "15px 0",
                  display: "block",
                  textAlign: "center",
                },
                footerActionLink: {
                  color: "#0095f6",
                  fontSize: "14px",
                  fontWeight: "600",
                  textDecoration: "none",
                },
                dividerLine: {
                  backgroundColor: "#dbdbdb",
                  height: "1px",
                  margin: "16px 0",
                },
                dividerText: {
                  color: "#8e8e8e",
                  fontSize: "13px",
                  fontWeight: "600",
                  textTransform: "lowercase",
                  backgroundColor: "#ffffff",
                  padding: "0 18px",
                },
                identityPreviewEditButton: {
                  display: "none",
                },
                otpCodeFieldInput: {
                  border: "1px solid #dbdbdb",
                  borderRadius: "3px",
                  backgroundColor: "#fafafa",
                  fontSize: "16px",
                  fontWeight: "400",
                  height: "44px",
                  textAlign: "center",
                  width: "100%",
                  "&:focus": {
                    borderColor: "#b3b3b3",
                    backgroundColor: "#ffffff",
                  },
                },
                form: {
                  width: "100%",
                },
                formFieldInputGroup: {
                  marginBottom: "12px",
                },
              },
            }}
          />
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-4">
          <div className="bg-white border border-gray-300 rounded-sm py-6 px-4">
            <p className="text-sm text-gray-900">
              계정이 없으신가요?{" "}
              <a
                href="/sign-up"
                className="text-[#0095f6] font-semibold"
              >
                가입하기
              </a>
            </p>
          </div>
        </div>

        {/* App Download */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 mb-4">앱을 다운로드하세요.</p>
          <div className="flex justify-center space-x-2">
            <div className="w-32 h-10 bg-black rounded flex items-center justify-center">
              <span className="text-white text-xs font-medium">App Store</span>
            </div>
            <div className="w-32 h-10 bg-black rounded flex items-center justify-center">
              <span className="text-white text-xs font-medium">Google Play</span>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-400">
            <a href="#" className="hover:underline">Meta</a>
            <a href="#" className="hover:underline">소개</a>
            <a href="#" className="hover:underline">블로그</a>
            <a href="#" className="hover:underline">채용정보</a>
            <a href="#" className="hover:underline">도움말</a>
            <a href="#" className="hover:underline">API</a>
            <a href="#" className="hover:underline">개인정보처리방침</a>
            <a href="#" className="hover:underline">약관</a>
            <a href="#" className="hover:underline">위치</a>
            <a href="#" className="hover:underline">Instagram Lite</a>
            <a href="#" className="hover:underline">Threads</a>
            <a href="#" className="hover:underline">연락처 업로드 & 비사용자</a>
            <a href="#" className="hover:underline">Meta Verified</a>
          </div>
          <div className="text-center mt-4 text-xs text-gray-400">
            © 2025 Instagram from Meta
          </div>
        </div>
      </div>
    </div>
  );
}

