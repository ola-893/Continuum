export const IPFS_GATEWAY = "https://ipfs.io/ipfs/"; // Or another preferred gateway

export async function fetchIpfsMetadata(ipfsUri: string): Promise<any | null> {
    if (!ipfsUri || !ipfsUri.startsWith('ipfs://')) {
        console.error("Invalid IPFS URI provided:", ipfsUri);
        return null;
    }

    try {
        const cid = ipfsUri.replace('ipfs://', '');
        const url = `${IPFS_GATEWAY}${cid}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch IPFS metadata from ${url}: ${response.statusText}`);
        }

        const metadata = await response.json();
        return metadata;
    } catch (error) {
        console.error("Error fetching IPFS metadata:", error);
        return null;
    }
}
