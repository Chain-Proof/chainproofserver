import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import { Metaplex } from '@metaplex-foundation/js';

class TokenMetadataFetcher {
  constructor(rpcUrl = 'https://mainnet.helius-rpc.com/?api-key=53b061f7-82e6-4436-a39e-fe1cbfdf0394') {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.metaplex = Metaplex.make(this.connection);
  }

  async fetchTokenMetadata(mintAddress) {
    try {
      const mintPublicKey = new PublicKey(mintAddress);
      const mintInfo = await getMint(this.connection, mintPublicKey);
      
      const metadata = {
        mint: mintAddress,
        decimals: mintInfo.decimals,
        supply: mintInfo.supply.toString(),
        mintAuthority: mintInfo.mintAuthority ? mintInfo.mintAuthority.toString() : null,
        freezeAuthority: mintInfo.freezeAuthority ? mintInfo.freezeAuthority.toString() : null,
        isInitialized: mintInfo.isInitialized,
      };

      return metadata;
    } catch (error) {
      throw new Error(`Failed to fetch token metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchExtendedTokenMetadata(mintAddress) {
    try {
      const mintPublicKey = new PublicKey(mintAddress);
      const basicMetadata = await this.fetchTokenMetadata(mintAddress);
      
      let metaplexData = {};
      
      try {
        const metadataAccount = await this.metaplex
          .nfts()
          .findByMint({ mintAddress: mintPublicKey });

        metaplexData = {
          name: metadataAccount.name,
          symbol: metadataAccount.symbol,
          uri: metadataAccount.uri,
          image: metadataAccount.json?.image,
          description: metadataAccount.json?.description,
        };
      } catch (error) {
        // Silently continue without metaplex data
      }

      const extendedMetadata = {
        ...basicMetadata,
        ...metaplexData,
      };

      return extendedMetadata;
    } catch (error) {
      throw new Error(`Failed to fetch extended token metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateTokenMint(mintAddress) {
    try {
      const mintPublicKey = new PublicKey(mintAddress);
      await getMint(this.connection, mintPublicKey);
      return true;
    } catch {
      return false;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node metadata.js <token-mint-address>');
    process.exit(1);
  }

  const mintAddress = args[0];
  const fetcher = new TokenMetadataFetcher();

  try {
    const isValid = await fetcher.validateTokenMint(mintAddress);
    if (!isValid) {
      console.error(`Error: ${mintAddress} is not a valid token mint address`);
      process.exit(1);
    }

    const extendedMetadata = await fetcher.fetchExtendedTokenMetadata(mintAddress);
    console.log(JSON.stringify(extendedMetadata, null, 2));

  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, null, 2));
    process.exit(1);
  }
}

// CRITICAL FIX: Only run main() if this file is executed directly, NOT when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, null, 2));
    process.exit(1);
  });
}

export { TokenMetadataFetcher };