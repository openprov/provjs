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
	return ((other instanceof QualifiedName)
	        && (this.namespaceURI===other.namespaceURI)
	        && (this.localPart===other.localPart)
	       );
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
	/* GETTERS & SETTERS */
	// Identifier
	id: function(identifier) {
		this.identifier = identifier;
		return this;
	},
	getId: function() {
		return this.id;
	},
	setAttr: function(k, v){
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

	// Arbitrary attributes
	getAttr: function(attr_name) {
		var results = [];
		for (var i = 0; i < this.attributes.length; i++) {
			if (attr_name.equals(this.attributes[i][0])) {
				results.push(this.attributes[i][1]);
			}
		}
		return results;
	}
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
    var provTerms = this.getPROVTerms();
    var term0 = this[provTerms[0]]; // The first term should always available
	if (this.identifier) {
		output.push(String(this.identifier) + "; " + term0);
	} else {
		output.push(term0);
	}
	var rel = provTerms.slice(1).map(function(x) {
		return (that[x]) ? that[x] : "-";
	}).join(", ");
    output.push(rel);

	var attr = this.attributes.map(function(x) {
		return x.join("=");
	}).join(", ");
	if (attr !== "") {
		output.push("["+attr+"]");
	}
	return this.provn_name + "(" + output.join(", ") + ")";
};

// Validation functions
function requireQualifiedName(value) {
    if (!(value instanceof QualifiedName)) {
        throw new Error("Expected a prov.QualifiedName value");
    }
}
function requireDate(value) {
    if (!(value instanceof Date)) {
        throw new Error("Expected a Date value");
    }
}

function defineProp(obj, propName, validator) {
    if (obj.properties === undefined) {
        obj.properties = {};
    }
    obj.properties[propName] = undefined;
    Object.defineProperty(obj, propName, {
        get: function () {
            return this.properties[propName];
        },
        set: function (newValue) {
            validator(newValue);
            this.properties[propName] = newValue;
        }
    })
}

function decoratePROVRelation(cls, provn_name, from, to, extras) {
    var proto = Object.create(Relation.prototype);
    proto.constructor = cls;
    proto.provn_name = provn_name;
    proto.relations = [];
    var provTerms = [from, to];
    // The first two terms are always required to be QualifiedName
    defineProp(proto, from, requireQualifiedName);
    defineProp(proto, to, requireQualifiedName);
    if (extras !== undefined) {
        for (var i = 0; i < extras.length; i++) {
            var term = extras[i];
            provTerms.push(term[0]);
            defineProp(proto, term[0], term[1]);
        }
    }
    Object.freeze(provTerms); // Prevent this array from being modified
    proto.getPROVTerms = function () {
        return provTerms; // returning the array above to avoid the same array being duplicated in every relation of the same type
    }
    cls.prototype = proto;
    return cls;
}

// TODO: Generation
// TODO: Usage
// TODO: Communication
// TODO: Start
// TODO: End
// TODO: Invalidation
// TODO: decide on whether to support special cases for Revision, Quotation, PrimarySource

function Derivation(generatedEntity, usedEntity) {
    Relation.call(this)
    this.generatedEntity = generatedEntity;
    this.usedEntity = usedEntity;
}

decoratePROVRelation(Derivation,
    "wasDerivedFrom", "generatedEntity", "usedEntity", [
        ["activity", requireQualifiedName],
        ["generation", requireQualifiedName],
        ["usage", requireQualifiedName]
    ]
);
function Attribution(entity, agent) {
    Relation.call(this);
    this.entity = entity;
    this.agent = agent;
}
decoratePROVRelation(Attribution,
    "wasAttributedTo", "entity", "agent"
);

// TODO: Association
// TODO: Delegation
// TODO: Influence
// TODO: Alternate
// TODO: Specialization
// TODO: Membership

// TODO: Bundles

function Document(statements) {
	this.statements = statements.slice(); // Cloning the list of statements
    // TODO Collect all namespaces used in various QualifiedName to define in the prefix block
    // This can also be done in when a document is exported to PROV-N or PROV-JSON
}

Document.prototype = {
    constructor: Document,
    toPROVJSON: function () {
        // TODO implement following _encode_JSON_container()
        // (See https://github.com/trungdong/prov/blob/master/prov/model/__init__.py#L1375)
    }
};

var provNS = new Namespace("prov", "http://www.w3.org/ns/prov#");
var xsdNS = new Namespace("xsd", "http://www.w3.org/2000/10/XMLSchema#");
xsdNS.QName = xsdNS.qname("QName");

// Factory class
function ProvJS() {
	// The factory class
	this.wrap = new Array();
}

ProvJS.prototype = {
    // Exposing classes via the ProvJS class
	URI: URI,
	QualifiedName: QualifiedName,
	Literal: Literal,
	Record: Record,
	Element: Element,
	Entity: Entity,
	Relation: Relation,
	Derivation: Derivation,
	Attribution: Attribution,

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
		this.pushContext(ret);
		return this;
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
				ret.setAttr(this.getValidQualifiedName(arguments[pos - 1]), this.getValidLiteral(arguments[pos]));
			}
		}
		this.pushContext(ret);
		return this;
	},
    wasAttributedTo: function(entity, agent) {
        var statement = new Attribution(this.getValidQualifiedName(entity), this.getValidQualifiedName(agent));
        // TODO Handle optional attribute-value pairs
        this.pushContext(statement);
        return this;
    },
    // Setting properties
    attr: function(attr_name, attr_value) {
		var context = this.getContext();
		if (context===undefined) {
			return(undefined);
		}
		if (attr_value === undefined) {
    		// Overloading this with getter behaviour
			return context.getAttr(this.getValidQualifiedName(attr_name));
		}
		var name = this.getValidQualifiedName(attr_name);
		var value = this.getValidLiteral(attr_value);
		context.setAttr(name, value);
		return this;
	},
	id: function() {
		var context = this.getContext();
		if (context === undefined) {
			return(undefined);
		}
		if (arguments.length == 0) {
			return context.id();
		} else {
			context.id(this.getValidQualifiedName(arguments[0]));
			return(this);
		}
	},
	// TODO prov:label
	// TODO prov:type
	// TODO prov:value
	// TODO prov:location
	// TODO prov:role


	// TODO Collect all created records
	toString: function() {
		return 'ProvJS('+this.wrap.join(", ")+')';
	},

    // Context management
	pushContext: function(o) {
		this.wrap.push(o);
	},
	getContext: function() {
		var l = this.wrap.length;
		if (l===0) {
			return undefined;
		} else {
			return this.wrap[l-1];
		}
	},
	// TODO Construct documents and bundles
    buildDocument: function() {
        return new Document(this.wrap);
    }
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
