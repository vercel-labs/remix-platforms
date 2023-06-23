import type {
  LoaderFunction,
  MetaFunction,
  HeadersFunction,
} from "@vercel/remix";
import { json } from "@vercel/remix";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "@/lib/prisma";

export const loader: LoaderFunction = async ({ request }) => {
  let host = request.headers.get("host");
  if (!host) throw new Error("Missing host");

  const domain = process.env.DOMAIN || "remix.pub";

  // for localhost, replace localhost:**** with remix.pub
  if (host.includes("localhost")) {
    host = host.replace(/localhost:\d+/, domain);
  }

  // for *.remix.pub subdomains, retrieve the subdomain slug
  if (host.endsWith(`.${domain}`)) {
    host = host.replace(`.${domain}`, "");
  }

  const currentSite = await prisma.site.findUnique({
    where: {
      slug: host,
    },
  });

  if (!currentSite) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const sites = await prisma.site.findMany({
    select: {
      slug: true,
    },
    take: 100,
  });

  return json({
    domain,
    sites,
    currentSite,
  });
};

export const meta: MetaFunction = ({ data }) => ({
  charset: "utf-8",
  title: data.currentSite.name,
  description: data.currentSite.description,
  viewport: "width=device-width,initial-scale=1",
});

export const headers: HeadersFunction = () => ({
  "Cache-Control": "max-age=3600, s-maxage=3600",
});

export default function Index() {
  const { domain, sites, currentSite } = useLoaderData<typeof loader>();

  return (
    <>
      <a
        href="https://github.com/vercel-labs/remix-platforms"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-5 right-5 max-h-fit rounded-lg p-2 transition-colors duration-200 hover:bg-stone-100 sm:bottom-auto sm:top-5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      </a>
      <div className="w-full h-screen flex flex-col items-center space-y-4 justify-center">
        <h1 className="font-bold text-3xl">{currentSite.name}</h1>
        <p className="text-gray-600 max-w-md text-center">
          {currentSite.description}
        </p>
        <div className="flex space-x-3 py-4 border-t border-gray-200">
          {sites.map(({ slug }: { slug: string }) => (
            <a
              key={slug}
              href={`http${
                process.env.NODE_ENV === "production" ? "s" : ""
              }://${slug}.${
                process.env.NODE_ENV === "production"
                  ? domain
                  : "localhost:3001"
              }`}
              className={`underline underline-offset-4 font-medium ${
                currentSite.slug === slug ? "text-black" : "text-gray-500"
              } hover:text-black transition-colors`}
            >
              {slug}.{domain}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
