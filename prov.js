/**
 * JavaScript library for PROV.
 * 
 * Copyright 2013 University of Southampton - All rights reserved.
 * Licence: To be determined
 */


// URI

function URI(uri) {
	this.uri = uri;
};

URI.prototype.getURI = function() {
	return this.uri;
};

exports.URI = URI;


// PROV Qualified Name
function QualifiedName(prefix, localPart, namespaceURI) {
	this.prefix = prefix;
	this.localPart = localPart;
	this.namespaceURI = namespaceURI;
	URI.call(this, namespaceURI + localPart);
};

QualifiedName.prototype = new URI;
QualifiedName.prototype.constructor = QualifiedName;
QualifiedName.prototype.toString = function() {
	var ret = this.prefix + ":" + this.localPart;
	return ret;
};
QualifiedName.prototype.equals = function(other) {
	return ((other instanceof QualifiedName) && (this.uri==other.uri));
};
exports.QualifiedName = QualifiedName;


// Namespace
function Namespace(prefix, namespaceURI) {
	this.prefix = prefix;
	this.namespaceURI = namespaceURI;
};

Namespace.prototype.qname = function(localPart) {
	var ret = new QualifiedName(this.prefix, localPart, this.namespaceURI);
	return ret;
};
exports.Namespace = Namespace;

// Literal and data types
function Literal(value, datatype, langtag) {
	this.value = value;
	this.datatype = datatype;
	this.langtag = langtag;
};
exports.Literal = Literal;


// Element
function Element(id, attr_value_pairs) {
	this.id = id;
	this.extra = [];
	if (attr_value_pairs && attr_value_pairs.length) {
		for (var i = 0; i < attr_value_pairs.length; i++) {
			var pair = attr_value_pairs[i];
			// TODO check the validity of attribute-value pair
			this.extra.push(pair);
		}
	}
};


// Entity
function Entity(id, attr_value_pairs) {
	Element.call(this, id, attr_value_pairs);
};
Entity.prototype = new Element;
Entity.prototype.toString = function() {
	var ret = "entity(" + this.id + ")";
	return ret;
};
exports.Entity = Entity;


// Derivation
function Derivation(generatedEntityID, usedEntityID) {
	this.generatedEntityID = generatedEntityID;
	this.usedEntityID = usedEntityID;
	this.attributes = [];
}
Derivation.prototype.get_attr = function(k)
{
	var result = [];
	for(var i=0; i<this.attributes.length; i++) {
		if (k.equals(this.attributes[i][0])) {
			result.push(this.attributes[i][1]);
		}
	}
	return(result);
}
Derivation.prototype.set_attr = function(k, v)
{
	this.attributes.push([k,v]);
}

Derivation.prototype.attr = function()
{
	var pos;
	var l = arguments.length;
	if (l == 1) {
		return this.get_attr(arguments[0]);
	} else {
		for(pos=1; pos<l; pos+=2) {
			this.set_attr(arguments[pos-1], arguments[pos]);
		}
		// TODO: flag wrong number of arguments
		return this;
	}
};
Derivation.prototype.toString = function() {
	var attr = this.attributes.map(function(x){return x.join("=");});
	if (attr!=="") { attr=", ["+attr+"]"; }
	var ret = "wasDerivedFrom(" + this.generatedEntityID + ", " + this.usedEntityID + attr+")";
	return ret;
};
exports.Derivation = Derivation;


function Document() {
	// This is a provanance document
}
exports.Document = Document;


// Utility class
function Utility() {
	// Keeping track of namespaces
	// Convenient methods for generating PROV statements
	// Construct a document
	this.namespaces = {};
};
Utility.prototype.addNamespace = function(ns_or_prefix, uri) {
	var ns;
	if (ns_or_prefix instanceof Namespace)
		ns = ns_or_prefix;
	else 
		ns = new Namespace(ns_or_prefix, uri);
	this.namespaces[ns.prefix] = ns;
	return ns;
};
Utility.prototype.getValidQualifiedName = function(id) {
	if (id instanceof QualifiedName)
		return id;

	// If id_str has a colon (:), check if the part before the colon is a registered prefix
	var components = id.split(":", 2);
	if (components.length == 2) {
		var prefix = components[0];
		if (prefix in this.namespaces)
			return this.namespaces[prefix].qname(components[1]);
	}
		
	// TODO If a default namespace is registered, use it

	console.error("Cannot validate identifier:", id);
	return id;
};
Utility.prototype.entity = function(id, attr_value_pairs) {
	return new Entity(this.getValidQualifiedName(id), attr_value_pairs);
};
Utility.prototype.wasDerivedFrom = function() {
	var result;
	if (arguments.length<2) {
		return null;
	}
	result = new Derivation(this.getValidQualifiedName(arguments[0]), this.getValidQualifiedName(arguments[1]));
	if (arguments.length>2) {
		// https://shifteleven.com/articles/2007/06/28/array-like-objects-in-javascript/
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		args.shift();
		Derivation.prototype.attr.apply(result, args);
	}
	return(result);
};
exports.Utility = Utility;

exports.ns = new Namespace("prov", "http://www.w3.org/ns/prov#");
