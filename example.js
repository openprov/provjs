/**
 * Example usages of the ProvJS library
 * 
 * Copyright 2013 University of Southampton - All rights reserved.
 * Licence: To be determined
 */

var prov = require("./prov");

// Register a namespace
var ex = prov.addNamespace("ex", "http://www.example.org/");

var e1 = prov.entity("ex:e1");
e1.set_attr(ex.qname("foo"), ex.qname("bar"));
e1.set_attr(ex.qname("baz"), prov.literal("abc", prov.namespaces.xsd.qname("string")));
e1.set_attr(ex.qname("bah"), prov.literal("1", prov.namespaces.xsd.qname("integer")));
e1.set_attr(ex.qname("bam"), prov.literal("bam", undefined, "en"));
console.log(e1);
console.log("" + e1);

var e2 = prov.entity("ex:e2");
e2.set_attr(ex.qname("dat"), prov.literal(new Date(Date.now())));
e2.set_attr(ex.qname("int"), prov.literal(1));
e2.set_attr(ex.qname("nint"), prov.literal(-1));
e2.set_attr(ex.qname("flt"), prov.literal(1.02));
e2.set_attr(ex.qname("str"), prov.literal("def"));
e2.set_attr(ex.qname("bool"), prov.literal(true));
console.log(e2);

var der1 = prov.wasDerivedFrom("ex:e2", "ex:e1");
der1.set_attr(prov.ns.qname("type"), prov.ns.qname("Revision"));
der1.id(ex.qname('d1'));
der1.activity = ex.qname('a1');
der1.set_attr(prov.ns.qname("type"), prov.ns.qname("Revision"));
console.log(der1);
console.log("" + der1);

console.log(der1.get_attr(prov.ns.qname("type")));

var der2 = prov.wasDerivedFrom("ex:e2", "ex:e1", "prov:type", "prov:Revision");
console.log(der2);
console.log("" + der2);


