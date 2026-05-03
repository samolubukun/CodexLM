import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['lh3.googleusercontent.com']
    },
    experimental: {
        turbo: {
            resolveAlias: {
                '@vladmandic/human': './node_modules/@vladmandic/human/dist/human.esm.js',
            },
        },
    },
    webpack: (config, { isServer }) => {
        // Force both client AND server builds to resolve @vladmandic/human
        // to the browser ESM bundle. The package's exports map is broken
        // (keys missing "./" prefix), and the default resolution picks
        // human.node.js which requires @tensorflow/tfjs-node (a native addon).
        // PrecisionScan is dynamic-imported with ssr:false so the server
        // never actually executes this code, but webpack still traces it.
        config.resolve.alias['@vladmandic/human'] = path.resolve(
            __dirname,
            'node_modules/@vladmandic/human/dist/human.esm.js'
        );

        // Suppress face-api.js / tfjs warnings about missing fs and encoding
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                encoding: false,
            };
        }
        return config;
    },
};

export default nextConfig;
