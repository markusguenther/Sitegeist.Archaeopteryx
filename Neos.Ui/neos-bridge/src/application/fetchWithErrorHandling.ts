/*
 * This script belongs to the package "Sitegeist.Archaeopteryx".
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */
import { fetchWithErrorHandling as _fetchWithErrorHandling } from "@neos-project/neos-ui-backend-connector";

type MakeFetchRequest = (csrf: string) => RequestInit & { url?: string };

export const fetchWithErrorHandling: {
    withCsrfToken(makeFetchRequest: MakeFetchRequest): Promise<any>;
    parseJson(response: Body): any;
    generalErrorHandler(reason: string | Error): void;
} = _fetchWithErrorHandling;
