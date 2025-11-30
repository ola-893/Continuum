const INDEXER_GQL_URL = 'https://api.testnet.aptoslabs.com/v1/graphql';

export class IndexerService {
    static async query(query: string, variables?: Record<string, any>): Promise<any> {
        const response = await fetch(INDEXER_GQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables,
            }),
        });

        if (!response.ok) {
            throw new Error(`GraphQL query failed: ${response.statusText}`);
        }

        const json = await response.json();
        if (json.errors) {
            throw new Error(`GraphQL query errors: ${JSON.stringify(json.errors)}`);
        }

        return json.data;
    }
}
