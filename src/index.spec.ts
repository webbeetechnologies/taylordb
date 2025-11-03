import {yolo, getLoan} from './index';

describe('index.js', () => {
  it('test yolo function', () => {
    expect(yolo(100)).toBe('yolo');
    expect(yolo(1)).toBe('no yolo');
  });

  it('test getLoan function', () => {
    expect(getLoan(60)).toBe(60);
    expect(() => getLoan(50)).toThrowError();
  });
});
