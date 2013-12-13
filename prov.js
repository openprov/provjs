/**
 * JavaScript library for PROV.
 * 
 * Copyright 2013 University of Southampton - All rights reserved.
 * Licence: To be determined
 */

/*jshint strict: true */

(function(window, undefined) {
	"use strict";

// URI
function URI(uri) {
	this.uri = uri;
}

URI.prototype.getURI = function() {
	return this.uri;
};


// PROV Qualified Name
function QualifiedName(prefix, localPart, namespaceURI) {
	this.prefix = prefix;
	this.localPart = localPart;
	this.namespaceURI = namespaceURI;
	URI.call(this, namespaceURI + localPart);
}

QualifiedName.prototype = Object.create(URI.prototype);
QualifiedName.prototype.constructor = QualifiedName;
QualifiedName.prototype.toString = function() {
	var ret = this.prefix + ":" + this.localPart;
	return ret;
};
QualifiedName.prototype.equals = function(other) {
	return ((other instanceof QualifiedName) && (this.uri===other.uri));
};


// Namespace
function Namespace(prefix, namespaceURI) {
	this.prefix = prefix;
	this.namespaceURI = namespaceURI;
}

Namespace.prototype.qname = function(localPart) {
	var ret = new QualifiedName(this.prefix, localPart, this.namespaceURI);
	return ret;
};

// Literal and data types
function Literal(value, datatype, langtag) {
	this.value = value;
	this.datatype = datatype;
	this.langtag = langtag;
}
Literal.prototype.constructor = Literal;
Literal.prototype.toString = function() {
	// TODO Suport for multi-line strings (triple-quoted)
	// TODO Check for special notation for some data types in PROV-N (e.g. QName)
	return ('"' + this.value + '"' +
			((this.langtag !== undefined) ? ('@' + this.langtag) : (' %% ' + this.datatype)));
};
Literal.prototype.equals = function(other) {
	// TODO check whether this is correct or is too strict
	return (   (other instanceof Literal)
	        && (this.value===other.value)
	        && (this.datatype===other.datatype)
	        && (this.langtag===other.langtag) );
};

// Record
function Record() {
	this.attributes = [];
}
Record.prototype = {
	// Reference to the factory that created this record
	creator: null,

	/* GETTERS & SETTERS */
	// Identifier
	id: function(identifier) {
		this.identifier = identifier;
		return this;
	},
	getId: function() {
		return this.id;
	},
	set_attr: function(k, v){
		var i;
		var existing = false;
		var values = this.getAttr(k);
		for(i=0; i<values.length; i++) {
			if (v.equals(values[i])) {
				existing = true;
				continue;
			}
		}
		if (!existing) {
			this.attributes.push([k,v]);
		}
	},
	// TODO prov:label
	// TODO prov:type
	// TODO prov:value
	// TODO prov:location
	// TODO prov:role
	
	// Arbitrary attributes
	attr: function(attr_name, attr_value) {
		// Overloading this with getter behaviour
		if (attr_value === undefined) {
			return this.getAttr(attr_name);
		}
		
		var name = this.creator ? this.creator.getValidQualifiedName(attr_name) : attr_name;
		var value = this.creator ? this.creator.getValidLiteral(attr_value) : attr_value;
		this.set_attr(name, value);
		return this;
	},
	getAttr: function(attr_name) {
		var name = this.creator ? this.creator.getValidQualifiedName(attr_name) : attr_name;
		var results = [];
		for (var i = 0; i < this.attributes.length; i++) {
			if (name.equals(this.attributes[i][0])) {
				results.push(this.attributes[i][1]);
			}
		}
		return results;
	},
};
 


// Element
function Element(identifier) {
	Record.call(this);
	this.identifier = identifier;
}
Element.prototype = Object.create(Record.prototype);
Element.prototype.constructor = Element;

// Entity
function Entity(identifier) {
	Element.call(this, identifier);
}
Entity.prototype = Object.create(Element.prototype);
Entity.prototype.constructor = Entity;
Entity.prototype.toString = function() {
	var output = [];
	output.push(String(this.identifier));
	var attr = this.attributes.map(function(x) {
		return x.join("=");
		}).join(", ");
	if (attr !== "") {
		output.push("["+attr+"]");
	}
	return "entity(" + output.join(", ") + ")";
};
// TODO: decide on whether to support Plan

// TODO: Agent
// Subclass Element

// TODO: Activity
// Subclass Element
// startTime, endTime
// TODO: decide on whether to support Person, Organization, SoftwareAgent

// Relation
function Relation()
{
	var i;
	Record.call(this);
	for(i=0; i<this.relations.length; i++) {
		this[this.relations[i]] = undefined;
	}
}
Relation.prototype = Object.create(Record.prototype);
Relation.prototype.constructor = Relation;
Relation.prototype.toString = function() {
	var that = this;
	var output = [];
	if (this.identifier) {
		output.push(String(this.identifier) + "; " + this[this.from]);
	} else {
		output.push(this[this.from]);
	}
	output.push(this[this.to]);
	var rel = this.relations.map(function(x) {
		return (that[x]) ? that[x] : "";
	}).join(", ");
	if (rel.split(", ").join("") !== "") {
		output.push(rel);
	}
	var attr = this.attributes.map(function(x) {
		return x.join("=");
	}).join(", ");
	if (attr !== "") {
		output.push("["+attr+"]");
	}
	return this.relation_name + "(" + output.join(", ") + ")";
};

// TODO: Generation
// TODO: Usage
// TODO: Communication
// TODO: Start
// TODO: End
// TODO: Invalidation
//
// Derivation
function Derivation(generatedEntityID, usedEntityID) {
	Relation.call(this);
	this.generatedEntityID = generatedEntityID;
	this.usedEntityID = usedEntityID;
}
Derivation.prototype = Object.create(Relation.prototype);
Derivation.prototype.constructor = Derivation;
Derivation.prototype.relations = ['activity', 'generation', 'usage'];
Derivation.prototype.relation_name = 'wasDerivedFrom';
Derivation.prototype.from = 'generatedEntityID';
Derivation.prototype.to = 'usedEntityID';

// TODO: decide on whether to support special cases for Revision, Quotation, PrimarySource

// TODO: Attribution
// TODO: Association
// TODO: Delegation
// TODO: Influence
// TODO: Alternate
// TODO: Specialization
// TODO: Membership

// TODO: Bundles

function Document() {
	// This is a provanance document
}

var provNS = new Namespace("prov", "http://www.w3.org/ns/prov#");
var xsdNS = new Namespace("xsd", "http://www.w3.org/2000/10/XMLSchema#");
xsdNS.QName = xsdNS.qname("QName");

// Factory class
function ProvJS() {
	// The factory class
}

ProvJS.prototype = {
	URI: URI,
	QualifiedName: QualifiedName,
	Literal: Literal,
	Record: Record,
	Element: Element,
	Entity: Entity,
	Relation: Relation,
	Derivation: Derivation,

	// All registered namespaces
	namespaces: {
		"prov": provNS,
		"xsd": xsdNS
	},
	// The PROV namespace
	ns: provNS,
		
	constructor: ProvJS,
	addNamespace: function(ns_or_prefix, uri) {
		var ns;
		if (ns_or_prefix instanceof Namespace) {
			ns = ns_or_prefix;
		} else {
			ns = new Namespace(ns_or_prefix, uri);
		}
		this.namespaces[ns.prefix] = ns;
		return ns;
	},
	getValidQualifiedName: function(identifier) {
		if (identifier instanceof QualifiedName) {
			return identifier;
		}

		// If id_str has a colon (:), check if the part before the colon is a registered prefix
		var components = identifier.split(":", 2);
		if (components.length === 2) {
			var prefix = components[0];
			if (prefix in this.namespaces) {
				return this.namespaces[prefix].qname(components[1]);
			}
		}
			
		// TODO If a default namespace is registered, use it

		console.error("Cannot validate identifier:", identifier);
		return identifier;
	},
	literal: function(value, datatype, langtag) {
		// Determine the data type for common types
		if ((datatype === undefined) && (langtag === undefined)) {
			// Missing both datatype and langtag
			if (typeof value === "string") {
				datatype = xsdNS.qname("string");
			} else
			if (typeof value === 'number') {
				if (Math.floor(value) === value) {
					datatype = xsdNS.qname("int");
				} else {
					datatype = xsdNS.qname("float");
				}
			} else
			if (typeof value === 'boolean') {
					datatype = xsdNS.qname("boolean");
			} else
			if (value instanceof Date) {
				value = value.toISOString();
				datatype = xsdNS.qname("dateTime");
			} else
			if (value instanceof QualifiedName) {
				datatype = xsdNS.QName;
			}
		} else {
			if (datatype !== undefined) {
				datatype = this.getValidQualifiedName(datatype);
				
				if (datatype.equals(xsdNS.QName)) {
					// Try to ensure a QualifiedName value
					value = this.getValidQualifiedName(value);
				}
			}
			// TODO Handle with langtag and undefined datatype
		}
		var ret = new Literal(value, datatype, langtag);
		return ret;
	},
	getValidLiteral: function(literal) {
		if (literal instanceof Literal) {
			return literal;
		}
		var ret;
		if (Array.isArray(literal)) {
			// Accepting literal as an array of [value, datatype, lang]
			ret = this.literal.apply(this, literal);
		}
		else
			// Accepting literal as a simple-type value 
			ret = this.literal(literal);
		return ret;
	},

	// PROV statements
	entity: function(identifier) {
		var ret = new Entity(this.getValidQualifiedName(identifier));
		ret.creator = this;
		return ret;
	},
	wasDerivedFrom: function() {
		var ret;
		var l = arguments.length;
		if (l < 2) {
			return undefined;
		}
		ret = new Derivation(this.getValidQualifiedName(arguments[0]), this.getValidQualifiedName(arguments[1]));
		if (l > 2) {
			for (var pos = 3; pos < l; pos += 2) {
				ret.attr(this.getValidQualifiedName(arguments[pos - 1]), arguments[pos]);
			}
		}
		ret.creator = this;
		return ret;
	}
	// TODO Collect all created records
	// TODO Construct documents and bundles
};

// This is the default ProvJS object
var rootProvJS = new ProvJS();

// Registering the prov object with the environment
if (typeof module === "object" && module && typeof module.exports === "object") {
	// Common.JS environments (e.g. node.js, PhantomJS)
	module.exports = rootProvJS;
} else {
	// Asynchronous module definition (AMD)
	if (typeof define === "function" && define.amd) {
		define( "prov", [], function () { return rootProvJS; } );
	}
}

if (typeof window === "object" && typeof window.document === "object") {
	// Browser environments
	window.prov = rootProvJS;
}

})(window);
