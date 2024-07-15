/*
 * This script belongs to the package "Sitegeist.Archaeopteryx".
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */
import { fetchWithErrorHandling } from "@sitegeist/archaeopteryx-neos-bridge";

import { NodeTypeFilterOptionDTO } from "../../domain";

type GetNodeTypeFilterOptionsQuery = {
    baseNodeTypeFilter: string;
};

type GetNodeTypeFilterOptionsQueryResultEnvelope =
    | {
          success: {
              options: NodeTypeFilterOptionDTO[];
          };
      }
    | {
          error: {
              type: string;
              code: number;
              message: string;
          };
      };

export async function getNodeTypeFilterOptions(
    query: GetNodeTypeFilterOptionsQuery
): Promise<GetNodeTypeFilterOptionsQueryResultEnvelope> {
    const searchParams = new URLSearchParams();

    searchParams.set("baseNodeTypeFilter", query.baseNodeTypeFilter);

    try {
        const response = await fetchWithErrorHandling.withCsrfToken(
            (csrfToken) => ({
                url:
                    "/sitegeist/archaeopteryx/get-node-type-filter-options?" +
                    searchParams.toString(),
                method: "GET",
                credentials: "include",
                headers: {
                    "X-Flow-Csrftoken": csrfToken,
                    "Content-Type": "application/json",
                },
            })
        );

        return fetchWithErrorHandling.parseJson(response);
    } catch (error) {
        fetchWithErrorHandling.generalErrorHandler(error as any);
        throw error;
    }
}
