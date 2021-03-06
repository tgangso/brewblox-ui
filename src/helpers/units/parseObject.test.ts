import Link from './Link';
import Unit from './Unit';

import { deserialize, serialize } from './parseObject';

describe('deserialize', () => {
  it('Should recognise properties structured as units', () => {
    const input = {
      test: 'Do not touch',
      something: 1,
      'unknownUnit[answers]': 42,
      'convert[celsius]': 25,
      normal: [21, 22, 23],
      'array[celsius]': [21, 22, 23],
    };

    const output = deserialize(input);

    expect(output.test).toBe('Do not touch');
    expect(output.something).not.toBeInstanceOf(Unit);
    expect(output.unknownUnit).not.toBeInstanceOf(Unit);
    expect(output.convert).toBeInstanceOf(Unit);
    expect(output.normal[0]).toBe(21);
  });

  it('Should recognise deep properties structured as units', () => {
    const input = {
      data: {
        test: 'Do not touch',
        'convert[celsius]': 25,
        evenDeeper: {
          'convert[fahrenheit]': 60,
        },
      },
    };

    const output = deserialize(input);

    expect(output.data.test).toBe('Do not touch');
    expect(output.data.convert).toBeInstanceOf(Unit);
    expect(output.data.evenDeeper.convert).toBeInstanceOf(Unit);
  });

  it('Should handle undefined and null properties', () => {
    const input = {
      normal: 'Okay',
      undef: undefined,
      nothing: null,
    };

    const output = deserialize(input);

    expect(input).toEqual(output);
  });

  it('Should handle when input is an array', () => {
    const input = [
      {
        'convert[celsius]': 25,
      },
      25,
      'do not touch',
    ];

    const output = deserialize(input);

    expect(output).toBeInstanceOf(Array);
    expect(output[1]).toBe(25);
    expect(output[2]).toBe('do not touch');
  });

  it('Should recognise properties structured as links', () => {
    const input = {
      test: 'Do not touch',
      something: 1,
      'sensor<>': 'some-sensor-id',
      'sensors<>': ['sensor-1', 'sensor-2'],
    };

    const output = deserialize(input);

    expect(output.test).toBe('Do not touch');
    expect(output.something).not.toBeInstanceOf(Link);
    expect(output.sensor).toBeInstanceOf(Link);
    expect(output.sensors[0]).toBeInstanceOf(Link);
  });
});

describe('serialize', () => {
  it('Converts unit properties for API saving', () => {
    const input = {
      temperature: new Unit(21, 'celsius'),
      leaveThisBe: 666,
      handleArray: [new Unit(22, 'celsius'), new Unit(23, 'celsius'), new Unit(24, 'celsius')],
      normalArray: [22, 23, 24],
      emptyArray: [],
      deeper: {
        temperatureInUSA: new Unit(60, 'fahrenheit'),
      },
    };

    const output = {
      'temperature[celsius]': 21,
      leaveThisBe: 666,
      'handleArray[celsius]': [22, 23, 24],
      normalArray: [22, 23, 24],
      emptyArray: [],
      deeper: {
        'temperatureInUSA[fahrenheit]': 60,
      },
    };

    expect(serialize(input)).toEqual(output);
  });

  it('Handles root arrays correctly', () => {
    const input = [
      20,
      {
        test: new Unit(23, 'celsius'),
      },
    ];

    const output = [
      20,
      {
        'test[celsius]': 23,
      },
    ];

    expect(serialize(input)).toEqual(output);
  });

  it('Converts link properties for API saving', () => {
    const input = {
      sensor: new Link('sensor-1'),
      deeper: {
        sensor: new Link('sensor-2'),
      },
    };

    const output = {
      'sensor<>': 'sensor-1',
      deeper: {
        'sensor<>': 'sensor-2',
      },
    };

    expect(serialize(input)).toEqual(output);
  });
});
