var _ = require('underscore');
var React = require('react');
var ReactART = require('react-art');

var Group = ReactART.Group;
var Path = ReactART.Path;
var Shape = ReactART.Shape;
var Surface = ReactART.Surface;
var Text = ReactART.Text;
var Pattern = ReactART.Pattern;

var circlePath = function(r) {
    return new Path()
        .moveTo(0, -r)
        // Two arcs make a circle
        .arcTo(0, r, r, r, true)
        .arcTo(0, -r, r, r, true)
        .close();
};

var linePath = function(x1, y1, x2, y2) {
    return new Path()
        .moveTo(x1, y1)
        .lineTo(x2, y2);
};

var countObjEndpoints = function(obj) {
  var children = Object.keys(obj);
  var nChildren = children.length;

  // Return a count of 1 if this node is an endpoint (i.e. has no children)
  if (nChildren === 0) {
    return 1;
  }

  // Go through each child and increment count by the number of endpoints
  var count = 0;
  for (var i = 0; i < nChildren; i++) {
    count += countObjEndpoints(obj[children[i]]);
  }
  return count;
};

var calculateObjectHeight = function(obj) {
  var children = Object.keys(obj);
  var nChildren = children.length;

  // Return a count of 1 if this node is an endpoint (i.e. has no children)
  if (nChildren === 0) {
    return 1;
  }

  // Go through each child and find the max height, then add 1 for this point
  var max = 0;
  for (var i = 0; i < nChildren; i++) {
    height = calculateObjectHeight(obj[children[i]]);
    max = Math.max(height, max);
  }
  return max + 1;

};

var NodeLine = React.createClass({
  render: function() {
    var x = this.props.x;
    var y = this.props.y;
    var parentX = this.props.parentX;
    var parentY = this.props.parentY;

    return (<Group x={x} y={y}>
      <Shape
        stroke="#ddd"
        strokeWidth="3"
        d={linePath(0, 0, parentX, parentY)}/>
    </Group>);
  }
});

var Node = React.createClass({
  defaultProps: {
    size: React.PropTypes.number.isRequired,
    value: React.PropTypes.number.isRequired,
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.isRequired
  },
  render: function() {
    var size = this.props.size;
    var fontSize = size*1.5 - 4;
    var fontAlignment = -fontSize / 2;

    var colorHue = this.props.colorHue.toString();

    var value = this.props.value;
    var x = this.props.x;
    var y = this.props.y;

    return (<Group x={x} y={y}>
        <Shape
          fill={`hsl(${colorHue}, 90%, 70%)`}
          stroke={`hsl(${colorHue}, 70%, 40%)`}
          strokeWidth="2"
          strokeJoin="round"
          d={circlePath(this.props.size)}/>
        <Text
          fill={`hsl(${colorHue}, 70%, 30%)`}
          font={`normal ${fontSize}px monospace`}
          y={fontAlignment}
          alignment="center">
          {value}
        </Text>
      </Group>);
  }
});

var NodeTree = React.createClass({
  defaultProps: {
    treeObj: React.PropTypes.object.isRequired,
    nNodes: React.PropTypes.number.isRequired,
    size: React.PropTypes.number.isRequired
  },

  getInitialState: function() {
    return {
      surfaceWidth: 600
    };
  },

  calculateSpacingSize: function() {
    return (this.state.surfaceWidth - 2*this.props.size)/(this.props.nNodes + 2);
  },

  calculateSurfaceHeight: function(treeObj) {
    return this.props.size*4 + this.calculateTreeHeight(treeObj)*(this.calculateSpacingSize());
  },

  calculateTreeHeight: function(treeObj) {
    return calculateObjectHeight(treeObj);
  },

  _renderTreeNodes: function(nodesObj, type, x, y, parent, colorHue) {
    var nodes = [];
    var childX;
    var childY;
    var nodeSize = this.props.size;
    var spacingSize = this.calculateSpacingSize();
    var hasParent = !_.isEmpty(parent);
    var parentX = parent.x;
    var parentY = parent.y;
    colorHue = colorHue != null ? colorHue + 30 : 0;

    _.each(nodesObj, (children, curNodeValue) => {

      var numEndpoints = countObjEndpoints(children);
      var hasChildren = !_.isEmpty(children);

      // Place the node halfway between the leftmost and rightmost endnodes
      childX = x + (spacingSize + spacingSize*numEndpoints)/2;
      childY = y + spacingSize;

      var nodeProps = {
        x: childX,
        y: childY,
        size: this.props.size,
        key: "node-" + type + "-" + curNodeValue
      };
      if (type === "line" && hasParent) {
        nodes.push(<NodeLine
          {...nodeProps}
          parentX={parentX - childX}
          parentY={parentY - childY}/>);
      } else if (type === "node") {
        nodes.push(<Node
          {...nodeProps}
          colorHue={colorHue}
          value={curNodeValue}/>);
      }

      if (hasChildren) {
        // Draw the children of this node ...
        nodes.push(
          this._renderTreeNodes(children, type, x, childY,
            {x: childX, y:childY}, colorHue)
        );
      }

      x += numEndpoints * spacingSize;
    });

    return nodes;
  },

  render: function() {
    var x = 30;
    var y = 30;
    var treeObj = this.props.treeObj;

    var surfaceWidth = this.state.surfaceWidth;
    var surfaceHeight = this.calculateSurfaceHeight(treeObj);

    return (
      <Surface width={surfaceWidth} height={surfaceHeight} style={{background: "#eee"}}>
        <Group>
          {this._renderTreeNodes(treeObj, "line", x, y, {})}
          {this._renderTreeNodes(treeObj, "node", x, y, {})}
          {false && <Group x="50" y="80">
          <Shape d={linePath(30, 0, 40, 50)} stroke="#abcdef"/>
          </Group>}
        </Group>
      </Surface>);
  }
});

module.exports = NodeTree;