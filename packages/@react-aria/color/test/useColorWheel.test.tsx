/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {act, fireEvent, render} from '@testing-library/react';
import {Color, useColorWheelState} from '@react-stately/color';
import {ColorWheelProps} from '@react-types/color';
import {installMouseEvent, installPointerEvent} from '@react-spectrum/test-utils';
import React, {useRef} from 'react';
import {useColorWheel} from '../';
import userEvent from '@testing-library/user-event';

const SIZE = 24;
const CENTER = SIZE / 2;
const THUMB_RADIUS = 9;

const getBoundingClientRect = () => ({
  width: SIZE, height: SIZE,
  x: 0, y: 0,
  top: 0, left: 0,
  bottom: SIZE, right: SIZE,
  toJSON() { return this; }
});


function ColorWheel(props: ColorWheelProps) {
  let state = useColorWheelState(props);
  let inputRef = useRef(null);
  let containerRef = useRef(null);

  let {inputProps, containerProps, thumbPosition: {x, y}, thumbProps} = useColorWheel({
    ...props,
    inputRef,
    containerRef,
    innerRadius: THUMB_RADIUS - 3,
    outerRadius: THUMB_RADIUS + 3
  }, state);

  return (<div data-testid="container" {...containerProps} ref={containerRef}>
    <div data-testid="thumb" data-dragging={state.dragging} {...thumbProps} style={{transform: `translate(${x}, ${y})`}}>
      <input {...inputProps} ref={inputRef} />
    </div>
  </div>);
}

describe('useColorWheel', () => {
  let onChangeSpy = jest.fn();

  afterEach(() => {
    onChangeSpy.mockClear();
  });

  it('sets input props', () => {
    let {getByRole} = render(<ColorWheel />);
    let slider = getByRole('slider');

    expect(slider).toHaveAttribute('type', 'range');
    expect(slider).toHaveAttribute('aria-label', 'hue');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '360');
    expect(slider).toHaveAttribute('step', '1');
  });

  it('the slider is focusable', () => {
    let {getAllByRole, getByRole} = render(<div>
      <button>A</button>
      <ColorWheel />
      <button>B</button>
    </div>);
    let slider = getByRole('slider');
    let [buttonA, buttonB] = getAllByRole('button');

    userEvent.tab();
    expect(document.activeElement).toBe(buttonA);
    userEvent.tab();
    expect(document.activeElement).toBe(slider);
    userEvent.tab();
    expect(document.activeElement).toBe(buttonB);
    userEvent.tab({shift: true});
    expect(document.activeElement).toBe(slider);
  });

  it('disabled', () => {
    let {getAllByRole, getByRole} = render(<div>
      <button>A</button>
      <ColorWheel isDisabled />
      <button>B</button>
    </div>);
    let slider = getByRole('slider');
    let [buttonA, buttonB] = getAllByRole('button');
    expect(slider).toHaveAttribute('disabled');

    userEvent.tab();
    expect(document.activeElement).toBe(buttonA);
    userEvent.tab();
    expect(document.activeElement).toBe(buttonB);
    userEvent.tab({shift: true});
    expect(document.activeElement).toBe(buttonA);
  });

  describe('keyboard events', () => {
    it('works', () => {
      let defaultColor = new Color('hsl(0, 100%, 50%)');
      let {getByRole} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} />);
      let slider = getByRole('slider');
      act(() => {slider.focus();});

      fireEvent.keyDown(slider, {key: 'Right'});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 1).toString('hsla'));
      fireEvent.keyDown(slider, {key: 'Left'});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 0).toString('hsla'));
    });

    it('doesn\'t work when disabled', () => {
      let defaultColor = new Color('hsl(0, 100%, 50%)');
      let {getByRole} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} isDisabled />);
      let slider = getByRole('slider');
      act(() => {slider.focus();});

      fireEvent.keyDown(slider, {key: 'Right'});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      fireEvent.keyDown(slider, {key: 'Left'});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
    });

    it('wraps around', () => {
      let defaultColor = new Color('hsl(0, 100%, 50%)');
      let {getByRole} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} />);
      let slider = getByRole('slider');
      act(() => {slider.focus();});

      fireEvent.keyDown(slider, {key: 'Left'});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 359).toString('hsla'));
    });

    it('respects step', () => {
      let defaultColor = new Color('hsl(0, 100%, 50%)');
      let {getByRole} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} step={45} />);
      let slider = getByRole('slider');
      act(() => {slider.focus();});

      fireEvent.keyDown(slider, {key: 'Right'});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 45).toString('hsla'));
      fireEvent.keyDown(slider, {key: 'Left'});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 0).toString('hsla'));
    });
  });

  describe.each`
    type                | actions                                                                 | prepare
    ${'Mouse Events'}   | ${[fireEvent.mouseDown, fireEvent.mouseMove, fireEvent.mouseUp]}        | ${installMouseEvent}
    ${'Pointer Events'} | ${[fireEvent.pointerDown, fireEvent.pointerMove, fireEvent.pointerUp]}  | ${installPointerEvent}
    ${'Touch Events'}   | ${[
      (el, {pageX, pageY}) => fireEvent.touchStart(el, {targetTouches: [{pageX, pageY}]}),
      (el, {pageX, pageY}) => fireEvent.touchMove(el, {targetTouches: [{pageX, pageY}]}),
      (el, {pageX, pageY}) => fireEvent.touchEnd(el, {targetTouches: [{pageX, pageY}]})
    ]}      | ${() => {}}
  `('$type', ({actions: [start, move, end], prepare}) => {
    prepare();

    it('dragging the thumb works', () => {
      let defaultColor = new Color('hsl(0, 100%, 50%)');
      let {getByRole, getByTestId} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} />);
      let thumb = getByTestId('thumb');
      let slider = getByRole('slider');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;

      expect(document.activeElement).not.toBe(slider);
      start(thumb, {pageX: CENTER + THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(thumb.dataset.dragging).toBe('true');
      expect(document.activeElement).toBe(slider);

      move(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 90).toString('hsla'));
      expect(thumb.dataset.dragging).toBe('true');
      expect(document.activeElement).toBe(slider);

      end(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(thumb.dataset.dragging).toBe('false');
      expect(document.activeElement).toBe(slider);
    });

    it('dragging the thumb doesn\'t works when disabled', () => {
      let defaultColor = new Color('hsl(0, 100%, 50%)');
      let {getByRole, getByTestId} = render(<ColorWheel isDisabled defaultValue={defaultColor} onChange={onChangeSpy} />);
      let thumb = getByTestId('thumb');
      let slider = getByRole('slider');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;

      expect(document.activeElement).not.toBe(slider);
      start(thumb, {pageX: CENTER + THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(thumb.dataset.dragging).toBe('false');
      expect(document.activeElement).not.toBe(slider);

      move(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(thumb.dataset.dragging).toBe('false');
      expect(document.activeElement).not.toBe(slider);

      end(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(thumb.dataset.dragging).toBe('false');
      expect(document.activeElement).not.toBe(slider);
    });

    it('dragging the thumb respects the step', () => {
      let defaultColor = new Color('hsl(0, 100%, 50%)');
      let {getByTestId} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} step={120} />);
      let thumb = getByTestId('thumb');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;

      start(thumb, {pageX: CENTER + THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      move(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 120).toString('hsla'));
      end(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('clicking and dragging on the track works', () => {
      let defaultColor = new Color('hsl(0, 100%, 50%)');
      let {getByRole, getByTestId} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} />);
      let thumb = getByTestId('thumb');
      let slider = getByRole('slider');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;

      expect(document.activeElement).not.toBe(slider);
      start(container, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 90).toString('hsla'));
      expect(thumb.dataset.dragging).toBe('true');
      expect(document.activeElement).toBe(slider);

      move(thumb, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 180).toString('hsla'));
      expect(thumb.dataset.dragging).toBe('true');
      expect(document.activeElement).toBe(slider);

      end(thumb, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(thumb.dataset.dragging).toBe('false');
      expect(document.activeElement).toBe(slider);
    });

    it('clicking and dragging on the track doesn\'t work when disabled', () => {
      let defaultColor = new Color('hsl(0, 100%, 50%)');
      let {getByRole, getByTestId} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} isDisabled />);
      let thumb = getByTestId('thumb');
      let slider = getByRole('slider');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;

      expect(document.activeElement).not.toBe(slider);
      start(container, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(thumb.dataset.dragging).toBe('false');
      expect(document.activeElement).not.toBe(slider);

      move(container, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(thumb.dataset.dragging).toBe('false');
      expect(document.activeElement).not.toBe(slider);

      end(container, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(thumb.dataset.dragging).toBe('false');
      expect(document.activeElement).not.toBe(slider);
    });

    it('clicking and dragging on the track respects the step', () => {
      let defaultColor = new Color('hsl(0, 100%, 50%)');
      let {getByTestId} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} step={120} />);
      let thumb = getByTestId('thumb');
      let container = getByTestId('container');
      container.getBoundingClientRect = getBoundingClientRect;

      start(container, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 120).toString('hsla'));
      move(thumb, {pageX: CENTER, pageY: CENTER - THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 240).toString('hsla'));
      end(thumb, {pageX: CENTER, pageY: CENTER - THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
    });
  });
});
