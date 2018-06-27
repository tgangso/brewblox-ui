import Unit from './Unit';

export class Temperature extends Unit {}

export class Celsius extends Temperature {
  unit: string = 'celsius';

  toString(): string {
    return `${this.roundedValue} °C`;
  }
}

export class Fahrenheit extends Temperature {
  unit: string = 'fahrenheit';

  toString(): string {
    return `${this.roundedValue} °F`;
  }
}
