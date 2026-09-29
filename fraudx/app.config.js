// Extends app.json. WEB_BASE_URL lets the web export live under a subpath
// (GitHub Pages serves this repo from /fraudxproject/). Production-only.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.WEB_BASE_URL ? { baseUrl: process.env.WEB_BASE_URL } : {}),
  },
});
