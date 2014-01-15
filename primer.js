/**
 * The prov-primer example (created from http://www.w3.org/TR/prov-primer/primer-provn-examples.provn).
 */

// Required: prov.js loaded by this point
function primer() {
    "use strict";

    var doc = prov.document();

    // Prefix declarations
    var ex = doc.addNamespace("ex", "http://www.example.org#");
    var dcterms = doc.addNamespace("dcterms", "http://purl.org/dc/terms/");
    var foaf = doc.addNamespace("foaf", "http://xmlns.com/foaf/0.1/");

    // Entities
    doc.entity("ex:article", ["dcterms:title", "Crime rises in cities"]);
    doc.entity("ex:dataSet1");
    doc.entity("ex:regionList");
    doc.entity("ex:compositionList");
    doc.entity("ex:chart1");
    
    // Activities
    doc.activity("ex:compile1");
    doc.activity("ex:compose1");
    doc.activity("ex:illustrate1");
    
    // Usage and Generation
    doc.used("ex:compose1", "ex:dataset1");
    doc.used("ex:compose1", "ex:regionList");
    doc.wasGeneratedBy("ex:composition1", "ex:compose1");
    doc.used("ex:illustrate1", "ex:composition1");
    doc.wasGeneratedBy("ex:chart1", "ex:illustrate1");

    // Agents and Responsibility
    doc.wasAssociatedWith("ex:compose1", "ex:derek");
    doc.wasAssociatedWith("ex:illustrate1", "ex:derek");
    doc.agent("ex:derek",
      ["prov:type", prov.ns.Person, "foaf:givenName", "Derek",
       "foaf:mbox", "<mailto:derek@example.org>"]);

    // Roles
    doc.agent("ex:chartgen",
      ["prov:type", prov.ns.Organization,
       "foaf:name", "Chart Generators Inc"]);
    doc.actedOnBehalfOf("ex:derek", "ex:chartgen");

    doc.wasAttributedTo("ex:chart1", "ex:derek");
    
    doc.used("ex:compose1", "ex:dataset1", ["prov:role", ex.qn("dataToCompose")]);
    doc.used("ex:compose1", "ex:regionList", ["prov:role", ex.qn("regionsToAggregateBy")]);
    doc.wasAssociatedWith("ex:compose1", "ex:derek", ["prov:role", ex.qn("analyst")]);
    doc.wasGeneratedBy("ex:composition1", "ex:compose1", ["prov:role", ex.qn("composedData")]);
    
    // Derivation and Revision
    doc.entity("ex:dataSet2");
    doc.wasDerivedFrom("ex:dataSet2", "ex:dataset1", ["prov:type", prov.ns.Revision]);
    doc.wasDerivedFrom("ex:chart2", "ex:dataSet2");
    doc.entity("ex:chart2");
    doc.wasDerivedFrom("ex:chart2", "ex:chart1", ["prov:type", prov.ns.Revision]);
    
    // Plans
    doc.activity("ex:correct1");
    doc.agent("ex:edith", ["prov:type", prov.ns.Person]);
    doc.entity("ex:instructions");
    doc.wasAssociatedWith("ex:correct1", "ex:edith", "ex:instructions");
    doc.wasGeneratedBy("ex:dataSet2", "ex:correct1");
    
    // Time
    doc.wasGeneratedBy("ex:chart1", "ex:compile1",  "2012-03-02T10:30:00");
    doc.wasGeneratedBy("ex:chart2", "ex:compile2", "2012-04-01T15:21:00");
    doc.activity("ex:correct1", "2012-03-31T09:21:00", "2012-04-01T15:21:00");
    
    // Alternate Entities and Specialization
    doc.entity("ex:quoteInBlogEntry-20130326");
    doc.wasDerivedFrom("ex:quoteInBlogEntry-20130326", "ex:article", ["prov:type", prov.ns.Quotation]);
        
    doc.entity("ex:articleV1");
    doc.specializationOf("ex:articleV1", "ex:article");
    doc.specializationOf("ex:articleV2", "ex:article");
    doc.alternateOf("ex:articleV2", "ex:articleV1");
    return doc.scope;
}