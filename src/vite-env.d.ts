/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_FIREBASE_API_KEY: string
	readonly VITE_FIREBASE_AUTH_DOMAIN: string
	readonly VITE_FIREBASE_PROJECT_ID: string
	readonly VITE_FIREBASE_STORAGE_BUCKET: string
	readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
	readonly VITE_FIREBASE_APP_ID: string
	readonly VITE_FIREBASE_MEASUREMENT_ID: string
	readonly VITE_AI_PROVIDER?: string
	readonly VITE_OPENAI_API_BASE_URL?: string
	readonly VITE_OPENAI_API_KEY?: string
	readonly VITE_OPENAI_DEFAULT_MODEL?: string
	readonly VITE_GOOGLE_AI_API_KEY?: string
	readonly VITE_GOOGLE_AI_BASE_URL?: string
	readonly VITE_GOOGLE_AI_DEFAULT_MODEL?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
