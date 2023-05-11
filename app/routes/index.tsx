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

  const sites = await prisma.site.findMany({
    select: {
      slug: true,
    },
    take: 100,
  });

  const currentSite = await prisma.site.findUnique({
    where: {
      slug: host,
    },
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
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1 className="text-red-500">{currentSite.name}</h1>
      <p>{currentSite.description}</p>
      <ul>
        {sites.map(({ slug }: { slug: string }) => (
          <li key={slug}>
            <a
              href={`https://${slug}.${domain}`}
              className={`text-underline underline-offset-4 font-medium ${
                currentSite.slug === slug ? "text-black" : "text-gray-500"
              } hover:text-black transition-colors`}
            >
              {slug}.{domain}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
