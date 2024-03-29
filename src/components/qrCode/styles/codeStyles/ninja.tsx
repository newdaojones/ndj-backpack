import React from 'react';
import {Rect} from 'react-native-svg';

export function drawNinjaPiece(
  x: number,
  y: number,
  modules: any[],
  pieceProperties: any,
  props: any,
) {
  var orientation = pieceProperties.orientation;
  var pieceType = pieceProperties.pieceType;
  var width = props.size;
  var height = props.size;
  var length = modules.length;
  var xsize = width / (length + 2 * props.padding);
  var ysize = height / (length + 2 * props.padding);
  var px = x * xsize + props.padding * xsize;
  var py = y * ysize + props.padding * ysize;

  // !!!! These aren't the proper paths yet
  switch (pieceType) {
    case '2b':
      return (
        <Rect
          key={px + ':' + py}
          x={-(xsize / 2)}
          y={-(ysize / 2)}
          originX={px + xsize / 2}
          originY={py + ysize / 2}
          rotate={orientation}
          width={xsize}
          height={ysize}
          fill={props.color}
        />
      );
    case '1b':
      return (
        <Rect
          key={px + ':' + py}
          x={-(xsize / 2)}
          y={-(ysize / 2)}
          originX={px + xsize / 2}
          originY={py + ysize / 2}
          rotate={orientation}
          width={xsize}
          height={ysize}
          fill={props.color}
        />
      );
    case '1b3b':
      return (
        <Rect
          key={px + ':' + py}
          x={-(xsize / 2)}
          y={-(ysize / 2)}
          originX={px + xsize / 2}
          originY={py + ysize / 2}
          rotate={orientation}
          width={xsize}
          height={ysize}
          fill={props.color}
        />
      );
    case '2a1b':
      return (
        <Rect
          key={px + ':' + py}
          x={-(xsize / 2)}
          y={-(ysize / 2)}
          originX={px + xsize / 2}
          originY={py + ysize / 2}
          rotate={orientation}
          width={xsize}
          height={ysize}
          fill={props.color}
        />
      );
    case '2a1b1a':
      return (
        <Rect
          key={px + ':' + py}
          x={-(xsize / 2)}
          y={-(ysize / 2)}
          originX={px + xsize / 2}
          originY={py + ysize / 2}
          rotate={orientation}
          width={xsize}
          height={ysize}
          fill={props.color}
        />
      );
    case '2a1b2c':
      return (
        <Rect
          key={px + ':' + py}
          x={-(xsize / 2)}
          y={-(ysize / 2)}
          originX={px + xsize / 2}
          originY={py + ysize / 2}
          rotate={orientation}
          width={xsize}
          height={ysize}
          fill={props.color}
        />
      );
    case '2a1b2c3b':
      return (
        <Rect
          key={px + ':' + py}
          x={-(xsize / 2)}
          y={-(ysize / 2)}
          originX={px + xsize / 2}
          originY={py + ysize / 2}
          rotate={orientation}
          width={xsize}
          height={ysize}
          fill={props.color}
        />
      );
    default:
      return (
        <Rect
          key={px + ':' + py}
          x={-(xsize / 2)}
          y={-(ysize / 2)}
          originX={px + xsize / 2}
          originY={py + ysize / 2}
          rotate={orientation}
          width={xsize}
          height={ysize}
          fill={props.color}
        />
      );
  }
}
