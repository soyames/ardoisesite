/**
 * Every school hosts its own backend on its own machine/domain (see
 * the ardoise backend repo's PROJECT_BRIEF.md, "Hosting model") --
 * this PWA is one shared static app that talks to whichever school's
 * API it's pointed at. VITE_API_BASE_URL is baked in at build time
 * for now (one build per school, or a single build for the pilot
 * school) -- a runtime "pick your school" workspace switcher, the
 * long-term answer described in that doc, is not built yet.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
