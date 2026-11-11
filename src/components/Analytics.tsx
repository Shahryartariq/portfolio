import Script from "next/script";

/** Google Analytics 4, only when GA_MEASUREMENT_ID is set. */
export function Analytics() {
  const id = process.env.GA_MEASUREMENT_ID;
  if (!id || !/^G-[A-Z0-9]+$/.test(id)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","${id}");`}
      </Script>
    </>
  );
}
