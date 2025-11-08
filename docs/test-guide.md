## Test Guide
### 1. Automated Testing
#### Install dependencies
```
pnpm install
```

#### Run test cases and generate coverage report
```
pnpm run coverage
```

output for example:

```

 ✓ test/subscan-api.test.ts (12) 9167ms
 ✓ test/substrate-chain.test.ts (23) 727968ms

 Test Files  2 passed (2)
      Tests  35 passed (35)
   Start at  02:40:49
   Duration  728.68s (transform 73ms, setup 0ms, collect 636ms, tests 737.13s, environment 0ms, prepare 100ms)

 % Coverage report from v8
----------------------------|---------|----------|---------|---------|--------------------------------------------------------
File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                      
----------------------------|---------|----------|---------|---------|--------------------------------------------------------
All files                   |    32.3 |     65.3 |      75 |    32.3 |                                                        
 src                        |       0 |        0 |       0 |       0 |                                                        
  assethub-service.ts       |       0 |        0 |       0 |       0 | 1-122                                                  
  constants.ts              |       0 |        0 |       0 |       0 | 1-24                                                   
  index.ts                  |       0 |        0 |       0 |       0 | 1-39                                                   
 src/actions                |       0 |        0 |       0 |       0 |                                                        
  address-assets-balance.ts |       0 |        0 |       0 |       0 | 1-294                                                  
  assets-transfer.ts        |       0 |        0 |       0 |       0 | 1-309                                                  
  get-my-wallet-info.ts     |       0 |        0 |       0 |       0 | 1-191                                                  
  my-wallet-history.ts      |       0 |        0 |       0 |       0 | 1-212                                                  
  send-message.ts           |       0 |        0 |       0 |       0 | 1-233                                                  
 src/common                 |   91.28 |    71.11 |   96.42 |   91.28 |                                                        
  subscan-api.ts            |   94.85 |    82.14 |     100 |   94.85 | 76-80,104-105,188-189,215-217,266-267                  
  substrate-chain.ts        |   89.37 |    66.12 |   95.45 |   89.37 | ...347,350-351,422-423,446-447,480-481,487-488,494-495 
----------------------------|---------|----------|---------|---------|--------------------------------------------------------
```

### 2. Manual Testing
