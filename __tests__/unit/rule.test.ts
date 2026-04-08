/* eslint-disable @typescript-eslint/no-unused-vars */
import { type DataCache, type RuleConfig, type RuleRequest, type RuleResult } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import {
  DatabaseManagerMock,
  determineOutcome,
  LoggerServiceMock,
  MockDatabaseManagerFactory,
  MockLoggerServiceFactory,
} from '@tazama-lf/frms-coe-lib/lib/tests/mocks';
import { handleTransaction, RuleExecutorConfig } from '../../src/rule';

const getRuleConfig = (): RuleConfig => {
  return {
    id: 'cbe-rule-new@1.0.0',
    cfg: '1.0.0',
    desc: 'VERSION 2: test amount transaction',
    config: {
      bands: [
        {
          reason: 'amount is big',
          subRuleRef: '.01',
          upperLimit: 1000,
        },
        {
          reason: 'amount is small',
          lowerLimit: 100,
          subRuleRef: '.02',
        },
      ],
      parameters: {
        tolerance: 0.1,
        maxQueryRange: 86400000,
      },
      exitConditions: [],
    },
    tenantId: 'DEFAULT',
  };
};

const getMockRequest = (): RuleRequest => {
  const quote = {
    transaction: JSON.parse(
      `{"TxTp":"amount","MsgId":"msg001","Payload":{"DOB":"10-10-2002","cnic":"1234-5678-910","MsgId":"msg001","amount":1000,"country":"PK","currency":"PKR"},"TenantId":"cbe"}`,
    ),
    networkMap: JSON.parse(
      '{"cfg":"1.0.0","name":"Public 701 Network Map","active":true,"messages":[{"id":"123@1.0.0","cfg":"1.0.0","txTp":"fable004","typologies":[{"id":"story-processor@1.0.0","cfg":"fables@1.0.0","rules":[{"id":"cbe-rule-fable004@1.0.0","cfg":"1.0.0"}],"tenantId":"cbe"}]},{"id":"135@1.0.0","cfg":"1.0.0","txTp":"amount","typologies":[{"id":"new-test-rule-processor@1.0.0","cfg":"new-test-rule@1.0.0","rules":[{"id":"cbe-rule-new@1.0.0","cfg":"1.0.0"}],"tenantId":"cbe"}]},{"id":"999@1.0.0","cfg":"1.0.0","txTp":"kashif123","typologies":[{"id":"kashif-processor@1.0.0","cfg":"kashif@1.0.0","rules":[{"id":"cbe-rule-kashif@1.0.0","cfg":"1.0.0"}],"tenantId":"cbe"}]},{"id":"456@1.0.0","cfg":"1.0.0","txTp":"amount_processor_transaction","typologies":[{"id":"test-processor@1.0.0","cfg":"test@1.0.0","rules":[{"id":"cbe-rule-test@1.0.0","cfg":"1.0.0"}],"tenantId":"cbe"}]},{"id":"004@1.0.0","cfg":"1.0.0","txTp":"dems_pacs002","typologies":[{"id":"typology-processor@1.0.0","cfg":"999@1.0.0","rules":[{"id":"EFRuP@1.0.0","cfg":"none"},{"id":"901@1.0.0","cfg":"1.0.0"},{"id":"902@1.0.0","cfg":"1.0.0"}],"tenantId":"cbe"}]}],"tenantId":"cbe"}',
    ),
    DataCache: JSON.parse(
      '{}',
    ),
  };
  return quote;
};

const getMockRequestUnsuccessful = (): RuleRequest => {
  const quote = getMockRequest();
  quote.transaction.FIToFIPmtSts.TxInfAndSts.TxSts = 'RJCT';
  return quote;
};

const ruleResult: RuleResult = {
  id: '021@1.0.0',
  cfg: '1.0.0',
  tenantId: 'DEFAULT',
  subRuleRef: '.err',
  reason: 'Unhandled rule result outcome',
};


const dataCache: DataCache = {
  dbtrId: 'dbtr_516c7065d75b4fcea6fffb52a9539357',
  cdtrId: 'cdtr_b086a1e193794192b32c8af8550d721d',
  dbtrAcctId: 'dbtrAcct_1fd08e408c184dd28cbaeef03bff1af5',
  cdtrAcctId: 'cdtrAcct_d531e1ba4ed84a248fe26617e79fcb64',
};

let databaseManager: DatabaseManagerMock<RuleExecutorConfig>;

let loggerService: LoggerServiceMock;
describe('Rule 021 Test', () => {
beforeEach(() => {
        loggerService = MockLoggerServiceFactory();
        loggerService.resetMock();
        databaseManager = MockDatabaseManagerFactory<RuleExecutorConfig>();
        databaseManager.resetMock();
  });
  describe('handleTransaction', () => {
    describe('Exit Conditions', () => {
let dataCache: DataCache;
        let req: RuleRequest;
beforeEach(() => {
        dataCache = {
            dbtrId: 'dbtr_516c7065d75b4fcea6fffb52a9539357',
            cdtrId: 'cdtr_b086a1e193794192b32c8af8550d721d',
            dbtrAcctId: 'dbtrAcct_1fd08e408c184dd28cbaeef03bff1af5',
            cdtrAcctId: 'cdtrAcct_d531e1ba4ed84a248fe26617e79fcb64',
        };
        req = getMockRequest();
      });
test('No RuleConfig - bands', async () => {
        const dbData = [1];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        const rConfig = getRuleConfig();
        rConfig.config.bands = undefined;
        try {
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - bands not provided');
        }
      });
test('No exit conditions', async () => {
        const dbData = [1, 2, 3];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          rConfig.config.exitConditions = undefined;
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - exitConditions not provided');
        }
      });
test('No tolerance', async () => {
        // Mocking the request of getting oldes transation timestamp
        const dbData = [1, 2, 3];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          rConfig.config.parameters!.tolerance = undefined;
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - tolerance parameter not provided or invalid type');
        }
      });
test('No tolerance - not number', async () => {
        const dbData = [1, 2, 3];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          rConfig.config.parameters!.tolerance = 'zero point two';
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - tolerance parameter not provided or invalid type');
        }
      });
    });
  });
});