import { Web3Storage, File } from "web3.storage";
const token = process.env.WEB3_STORAGE_TOKEN!;
export const client = new Web3Storage({ token });

export async function uploadGame(
  pairs: File[],
  reveal: File[] | undefined,
  message: string
): Promise<string> {
  const metadata = new File(
    [JSON.stringify({ message, pairs: pairs.map(f=>f.name), reveal: reveal?.map(f=>f.name)||[] })],
    "metadata.json",
    { type: "application/json" }
  );
  const cid = await client.put([...pairs, ...(reveal ?? []), metadata], { wrapWithDirectory: true });
  return cid;   // will be used as the slug
}

export const gatewayUrl = (cid:string, filename:string) => `https://w3s.link/ipfs/${cid}/${filename}`;