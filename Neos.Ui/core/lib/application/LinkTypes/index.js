"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLinkTypes = void 0;
var neos_ui_extensibility_1 = require("@neos-project/neos-ui-extensibility");
var WebLink_1 = require("./WebLink");
var NodeTree_1 = require("./NodeTree");
var Asset_1 = require("./Asset");
var MailTo_1 = require("./MailTo");
function registerLinkTypes(globalRegistry) {
    var linkTypeRegistry = new neos_ui_extensibility_1.SynchronousRegistry("\n        # Sitegeist.Archaeopteryx LinkType Registry\n    ");
    linkTypeRegistry.set(WebLink_1.WebLink.id, WebLink_1.WebLink);
    linkTypeRegistry.set(NodeTree_1.NodeTree.id, NodeTree_1.NodeTree);
    linkTypeRegistry.set(Asset_1.Asset.id, Asset_1.Asset);
    linkTypeRegistry.set(MailTo_1.MailTo.id, MailTo_1.MailTo);
    globalRegistry.set('@sitegeist/archaeopteryx/link-types', linkTypeRegistry);
}
exports.registerLinkTypes = registerLinkTypes;
//# sourceMappingURL=index.js.map