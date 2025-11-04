import { ApiRole } from "ordercloud-javascript-sdk";

//Basic auth configuration
const APP_NAME = import.meta.env.VITE_APP_NAME || "Application Name";
const BASE_API_URL =
  import.meta.env.VITE_APP_ORDERCLOUD_BASE_API_URL ||
  "https://api.ordercloud.io/v1";
const CLIENT_ID = import.meta.env.VITE_APP_ORDERCLOUD_CLIENT_ID;
const SCOPE_STRING = import.meta.env.VITE_APP_ORDERCLOUD_SCOPE;
const CUSTOM_SCOPE_STRING = import.meta.env.VITE_APP_ORDERCLOUD_CUSTOM_SCOPE;

const SCOPE: ApiRole[] = SCOPE_STRING?.length
  ? (SCOPE_STRING.split(",") as ApiRole[])
  : [];
const CUSTOM_SCOPE: string[] = CUSTOM_SCOPE_STRING?.length
  ? CUSTOM_SCOPE_STRING.split(",")
  : [];

//Anonymous auth configuration
const ALLOW_ANONYMOUS_STRING = import.meta.env
  .VITE_APP_ORDERCLOUD_ALLOW_ANONYMOUS;
const ALLOW_ANONYMOUS: boolean = Boolean(ALLOW_ANONYMOUS_STRING === "true");

//Other configs
const IS_MULTILOCATION_STRING = import.meta.env
  .VITE_APP_ORDERCLOUD_MULTILOCATION_INVENTORY;
const IS_MULTI_LOCATION_INVENTORY = Boolean(IS_MULTILOCATION_STRING === "true");
const IS_AUTO_APPLY_STRING = import.meta.env
  .VITE_APP_ORDERCLOUD_AUTO_APPLY_PROMOS;
const IS_AUTO_APPLY = Boolean(IS_AUTO_APPLY_STRING === "true");

const BRAND_COLOR_PRIMARY =
  import.meta.env.VITE_APP_ORDERCLOUD_BRAND_COLOR_PRIMARY || "";
const BRAND_COLOR_SECONDARY =
  import.meta.env.VITE_APP_ORDERCLOUD_BRAND_COLOR_SECONDARY || "";
const BRAND_COLOR_ACCENT =
  import.meta.env.VITE_APP_ORDERCLOUD_BRAND_COLOR_ACCENT || "";

const BRAND_LOGO_LIGHT =
  "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iQXJ0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDU3NiAxNjEuMSI+CiAgPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI5LjEuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDIuMS4wIEJ1aWxkIDE0MikgIC0tPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuc3QwIHsKICAgICAgICBmaWxsOiAjZmYyMTAwOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8ZyBpZD0iTG9nbyI+CiAgICA8cGF0aCBpZD0iV29yZG1hcmsiIGNsYXNzPSJzdDAiIGQ9Ik01NzYsMTYxLjFoLTUyLjh2LTIwaDIzLjZ2LTE0LjNoLTIyLjFjLTE3LjMsMC0zMC43LTEzLTMwLjctMzAuNVYzMS41aDMwLjV2NzUuM2gyMVYzMS41aDMwLjV2MTI5LjZaTTQzMCw3Mi40aDIxdi0yMWgtMjF2MjFaTTQyOS4zLDEyNi44Yy0xNy4zLDAtMzAuNy0xMy0zMC43LTMwLjV2LTM0LjFjMC0xNy41LDEzLjMtMzAuNywzMC43LTMwLjdoMjAuNmMxNy4zLDAsMzAuNywxMy4yLDMwLjcsMzAuN3YzMC4zaC01MC41djE0LjNoNDF2MjBoLTQxLjhNMzYwLjMsMGgzNC45bC0zMiw2Mi41LDMzLDY0LjJoLTM0LjlsLTMzLTY0LjJMMzYwLjMsMFpNMjkyLDBoMzIuNHYxMjYuN2gtMzIuNFYwWk0yNDUuMywwaDMwLjV2MjBoLTMwLjVWMFpNMjQ1LjMsMzEuNWgzMC41djk1LjNoLTMwLjVWMzEuNVpNMTc4LjYsMTA2LjdoMjF2LTU1LjNoLTIxdjU1LjNaTTE3Ni43LDE0MS4xaDIzLjh2LTE0LjNoLTIyLjdjLTE3LjMsMC0zMC43LTEzLTMwLjctMzAuNXYtMzQuMWMwLTE3LjUsMTMuMy0zMC43LDMwLjctMzAuN2g1Mi4ydjEyOS42aC01My40di0yMGguMVpNMTAyLjQsMGgzMC41djIwaC0zMC41VjBaTTEwMi40LDMxLjVoMzAuNXY5NS4zaC0zMC41VjMxLjVaTTMyLjQsMTA1LjhoMjIuM1YyMWgtMjIuM3Y4NC44Wk0wLDBoNTYuNGMxOC41LDAsMzAuNywxMS4yLDMwLjcsMjguNnY2Ny43YzAsMTQuOS04LjIsMzAuNS0zMC43LDMwLjVIMFYwWiIvPgogIDwvZz4KPC9zdmc+";
const BRAND_LOGO_DARK =
  "https://mma.prnewswire.com/media/2003364/DigiKey_New_Logo.jpg";
const BRAND_FAVICON_LIGHT =
  "https://mma.prnewswire.com/media/2003364/DigiKey_New_Logo.jpg";
const BRAND_FAVICON_DARK =
  "https://mma.prnewswire.com/media/2003364/DigiKey_New_Logo.jpg";

// Dashboard configs
const DASHBOARD_HERO_TAGLINE =
  import.meta.env.VITE_APP_ORDERCLOUD_DASHBOARD_HERO_TAGLINE ||
  `Welcome to DigiKey's storefront app`;
const DASHBOARD_HERO_IMAGE =
  "https://sc-c.digikeyassets.com/-/media/Images/Homepage/Carousel/2024/04-shipping-boxes.jpg";
const DASHBOARD_HERO_CTA_TEXT =
  import.meta.env.VITE_APP_ORDERCLOUD_DASHBOARD_HERO_CTA_TEXT ||
  "Call to action";
const DASHBOARD_HERO_CTA_LINK = import.meta.env
  .VITE_APP_ORDERCLOUD_DASHBOARD_HERO_CTA_LINK;

const DASHBOARD_SECONDARY_IMAGE =
  "https://sc-a.digikeyassets.com/-/media/Images/Homepage/Carousel/2025/DigiKeyStandard.jpg";
const DASHBOARD_SECONDARY_HEADING =
  import.meta.env.VITE_APP_ORDERCLOUD_DASHBOARD_SECONDARY_HEADING ||
  "Secondary heading text";
const DASHBOARD_SECONDARY_DESCRIPTION =
  import.meta.env.VITE_APP_ORDERCLOUD_DASHBOARD_SECONDARY_DESCRIPTION ||
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const DASHBOARD_SECONDARY_CTA_TEXT =
  import.meta.env.VITE_APP_ORDERCLOUD_DASHBOARD_SECONDARY_CTA_TEXT ||
  "Call to action";
const DASHBOARD_SECONDARY_CTA_LINK = import.meta.env
  .VITE_APP_ORDERCLOUD_DASHBOARD_SECONDARY_CTA_LINK;

const DASHBOARD_TERTIARY_IMAGE =
  "https://sc-b.digikeyassets.com/-/media/Images/Homepage/Carousel/2025/Memory.jpg";
const DASHBOARD_TERTIARY_HEADING =
  import.meta.env.VITE_APP_ORDERCLOUD_DASHBOARD_TERTIARY_HEADING ||
  "Tertiary heading text";
const DASHBOARD_TERTIARY_DESCRIPTION =
  import.meta.env.VITE_APP_ORDERCLOUD_DASHBOARD_TERTIARY_DESCRIPTION ||
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const DASHBOARD_TERTIARY_CTA_TEXT =
  import.meta.env.VITE_APP_ORDERCLOUD_DASHBOARD_TERTIARY_CTA_TEXT ||
  "Call to action";
const DASHBOARD_TERTIARY_CTA_LINK = import.meta.env
  .VITE_APP_ORDERCLOUD_DASHBOARD_TERTIARY_CTA_LINK;

const AGENT_IFRAME_ORIGIN = import.meta.env.VITE_APP_AGENT_IFRAME_ORIGIN || "";

enum PAYMENT_PROVIDERS {
  CARD_CONNECT,
  PAYPAL,
  STRIPE,
  BLUESNAP,
  FAKE_GATEWAY,
}

const PAYMENT_PROVIDER = import.meta.env
  .VITE_APP_PAYMENT_PROVIDER as PAYMENT_PROVIDERS;

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

export {
  APP_NAME,
  BASE_API_URL,
  CLIENT_ID,
  SCOPE,
  CUSTOM_SCOPE,
  ALLOW_ANONYMOUS,
  IS_MULTI_LOCATION_INVENTORY,
  IS_AUTO_APPLY,
  BRAND_COLOR_PRIMARY,
  BRAND_COLOR_SECONDARY,
  BRAND_COLOR_ACCENT,
  BRAND_LOGO_LIGHT,
  BRAND_LOGO_DARK,
  BRAND_FAVICON_LIGHT,
  BRAND_FAVICON_DARK,
  DASHBOARD_HERO_TAGLINE,
  DASHBOARD_HERO_IMAGE,
  DASHBOARD_HERO_CTA_LINK,
  DASHBOARD_HERO_CTA_TEXT,
  DASHBOARD_SECONDARY_IMAGE,
  DASHBOARD_SECONDARY_HEADING,
  DASHBOARD_SECONDARY_DESCRIPTION,
  DASHBOARD_SECONDARY_CTA_TEXT,
  DASHBOARD_SECONDARY_CTA_LINK,
  DASHBOARD_TERTIARY_IMAGE,
  DASHBOARD_TERTIARY_HEADING,
  DASHBOARD_TERTIARY_DESCRIPTION,
  DASHBOARD_TERTIARY_CTA_TEXT,
  DASHBOARD_TERTIARY_CTA_LINK,
  PAYMENT_PROVIDER,
  PAYMENT_PROVIDERS,
  US_STATES,
  AGENT_IFRAME_ORIGIN
};
