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
console.log(e1);
console.log(""+e1);

var der1 = prov.wasDerivedFrom("ex:e2", "ex:e1");
der1.set_attr(prov.ns.qname("type"), prov.ns.qname("Revision"));
der1.id = ex.qname('d1');
der1.activity=ex.qname('a1');
der1.set_attr(prov.ns.qname("type"), prov.ns.qname("Revision"));
console.log(der1);
console.log(""+der1);

console.log(der1.get_attr(prov.ns.qname("type")));

var der2 = prov.wasDerivedFrom("ex:e2", "ex:e1", prov.ns.qname("type"), prov.ns.qname("Revision"));
console.log(der2);
console.log(""+der2);


