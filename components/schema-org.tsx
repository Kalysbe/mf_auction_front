import type { Organization, WebSite, WithContext, LocalBusiness, SiteNavigationElement } from "schema-dts"

export function OrganizationSchema() {
  const schema: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ADB SOLUTION",
    url: "https://adb-solution.com",
    logo: {
      "@type": "ImageObject",
      url: "https://adb-solution.com/logo.png",
      width: "512",
      height: "512",
    },
    image: "https://adb-solution.com/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+996555751592",
      contactType: "Customer Support",
      email: "gulzada@adb-solution.com",
    },
    sameAs: [
      "https://facebook.com/adbsolution",
      "https://twitter.com/adbsolution",
      "https://instagram.com/adbsolution",
      "https://linkedin.com/company/adbsolution",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Разакова 32",
      addressLocality: "Бишкек",
      addressCountry: "Кыргызстан",
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export function LocalBusinessSchema() {
  const schema: WithContext<LocalBusiness> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "ADB SOLUTION",
    image: "https://adb-solution.com/logo.png",
    logo: {
      "@type": "ImageObject",
      url: "https://adb-solution.com/logo.png",
      width: "512",
      height: "512",
    },
    url: "https://adb-solution.com",
    telephone: "+996555751592",
    email: "gulzada@adb-solution.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Разакова 32",
      addressLocality: "Бишкек",
      addressCountry: "Кыргызстан",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 42.8746,
      longitude: 74.5698,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    priceRange: "$",
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export function WebsiteSchema() {
  const schema: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ADB SOLUTION",
    url: "https://adb-solution.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://adb-solution.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export function SiteNavigationSchema() {
  const schema: WithContext<SiteNavigationElement> = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: [
      "Главная",
      "О нас",
      "Услуги",
      "Аудит",
      "Бухгалтерские услуги",
      "Налоговый консалтинг",
      "Бизнес-консалтинг",
      "Новости",
      "Контакты",
    ],
    url: [
      "https://adb-solution.com/",
      "https://adb-solution.com/about",
      "https://adb-solution.com/services",
      "https://adb-solution.com/services/audit",
      "https://adb-solution.com/services/accounting",
      "https://adb-solution.com/services/tax-consulting",
      "https://adb-solution.com/services/business-consulting",
      "https://adb-solution.com/news",
      "https://adb-solution.com/contacts",
    ],
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export function SchemaOrg() {
  return (
    <>
      <OrganizationSchema />
      <LocalBusinessSchema />
      <WebsiteSchema />
      <SiteNavigationSchema />
    </>
  )
}
