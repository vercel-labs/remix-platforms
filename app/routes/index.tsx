import type { LoaderFunction, MetaFunction } from "@vercel/remix";
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

export default function Index() {
  const { domain, sites, currentSite } = useLoaderData<typeof loader>();

  return (
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
              process.env.NODE_ENV === "production" ? domain : "localhost:3001"
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
  );
}
