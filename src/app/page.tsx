import Script from "next/script";
import Homepage from "@/components/homepage";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "NGO",
  name: "Heroes Rise Foundation",
  slogan: "Serving Those Who Serve. Saving Those Who Can't Speak.",
  url: "https://heroes-rise-foundation.vercel.app",
  description:
    "Heroes Rise Foundation supports veterans, first responders, and vulnerable animals through direct aid and community services.",
  sameAs: [
    "https://www.facebook.com/",
    "https://x.com/",
    "https://www.linkedin.com/"
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "hello@heroesrise.org"
  }
};

export default function HomePage() {
  return (
    <>
      <Script
        id="heroes-rise-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Homepage />
    </>
  );
}
