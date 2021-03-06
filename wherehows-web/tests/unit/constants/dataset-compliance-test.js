import { module, test } from 'qunit';
import {
  getComplianceSteps,
  complianceSteps,
  getFieldIdentifierOption,
  getFieldIdentifierOptions,
  isAutoGeneratedPolicy,
  PurgePolicy,
  initialComplianceObjectFactory,
  isRecentSuggestion,
  tagNeedsReview,
  lowQualitySuggestionConfidenceThreshold
} from 'wherehows-web/constants';
import complianceDataTypes from 'wherehows-web/mirage/fixtures/compliance-data-types';
import { mockTimeStamps } from 'wherehows-web/tests/helpers/datasets/compliance-policy/recent-suggestions-constants';
import { mockFieldChangeSets } from 'wherehows-web/tests/helpers/datasets/compliance-policy/field-changeset-constants';
import { hdfsUrn } from 'wherehows-web/mirage/fixtures/urn';

module('Unit | Constants | dataset compliance');

const complianceTagReviewOptions = {
  checkSuggestions: false,
  suggestionConfidenceThreshold: lowQualitySuggestionConfidenceThreshold
};

test('initialComplianceObjectFactory', function(assert) {
  assert.expect(2);
  const mockUrn = hdfsUrn;
  const initialComplianceInfo = {
    datasetUrn: mockUrn,
    datasetId: null,
    complianceType: '',
    compliancePurgeNote: '',
    complianceEntities: [],
    datasetClassification: null,
    confidentiality: null
  };

  assert.ok(typeof initialComplianceObjectFactory === 'function', 'initialComplianceObjectFactory is a function');
  assert.deepEqual(
    initialComplianceObjectFactory(mockUrn),
    initialComplianceInfo,
    'generates policy in expected shape'
  );
});

test('isRecentSuggestion exists', function(assert) {
  assert.expect(1);
  assert.ok(typeof isRecentSuggestion === 'function', 'isRecentSuggestion is a function');
});

test('isRecentSuggestion correctly determines if a suggestion is recent or not', function(assert) {
  assert.expect(mockTimeStamps.length);

  mockTimeStamps.forEach(({ policyModificationTime, suggestionModificationTime, __isRecent__, __assertMsg__ }) => {
    const recent = isRecentSuggestion(policyModificationTime, suggestionModificationTime);
    assert.ok(recent === __isRecent__, `${__assertMsg__} isRecent? ${recent}`);
  });
});

test('tagNeedsReview exists', function(assert) {
  assert.ok(typeof tagNeedsReview === 'function', 'tagNeedsReview is a function');

  assert.ok(
    typeof tagNeedsReview([], complianceTagReviewOptions)({}) === 'boolean',
    'tagNeedsReview returns a boolean'
  );
});

test('tagNeedsReview correctly determines if a fieldChangeSet requires review', function(assert) {
  assert.expect(mockFieldChangeSets.length);

  mockFieldChangeSets.forEach(changeSet =>
    assert.ok(
      tagNeedsReview(complianceDataTypes, complianceTagReviewOptions)(changeSet) === changeSet.__requiresReview__,
      changeSet.__msg__
    )
  );
});

test('getComplianceSteps function should behave as expected', function(assert) {
  assert.expect(3);
  const piiTaggingStep = { 0: { name: 'editDatasetLevelCompliancePolicy' } };
  let result;

  assert.equal(typeof getComplianceSteps, 'function', 'getComplianceSteps is a function');
  result = getComplianceSteps();

  assert.deepEqual(result, complianceSteps, 'getComplianceSteps result is expected shape when no args are passed');

  result = getComplianceSteps(false);
  assert.deepEqual(
    result,
    { ...complianceSteps, ...piiTaggingStep },
    'getComplianceSteps result is expected shape when hasSchema attribute is false'
  );
});

test('getFieldIdentifierOption function should behave as expected', function(assert) {
  const [complianceType] = complianceDataTypes;
  let result;

  assert.equal(typeof getFieldIdentifierOption, 'function', 'getFieldIdentifierOption is a function');
  result = getFieldIdentifierOption(complianceType);

  assert.ok(result.label === complianceType.title, 'title matches the resulting label');
  assert.ok(result.value === complianceType.id, 'id matches the resulting value');
});

test('getFieldIdentifierOptions function should behave as expected', function(assert) {
  let results;
  assert.equal(typeof getFieldIdentifierOptions, 'function', 'getFieldIdentifierOptions is a function');
  results = getFieldIdentifierOptions(complianceDataTypes);

  assert.ok(Array.isArray(results), 'getFieldIdentifierOptions returns an array');

  results.forEach((result, index) => {
    assert.ok(result.label === complianceDataTypes[index].title, 'title matches the resulting label');
    assert.ok(result.value === complianceDataTypes[index].id, 'id matches the resulting value');
  });
});

test('isAutoGeneratedPolicy function correctly determines if a policy is auto-generated', function(assert) {
  let result = isAutoGeneratedPolicy();

  assert.ok(result === false, 'expected return value of false when no arguments are supplied');

  result = isAutoGeneratedPolicy({
    complianceType: PurgePolicy.AutoPurge,
    complianceEntities: []
  });

  assert.ok(
    result,
    'expected return to be truthy when complianceEntities are empty and complianceType is a PurgePolicy'
  );

  result = isAutoGeneratedPolicy({
    complianceType: PurgePolicy.AutoPurge,
    complianceEntities: [1]
  });

  assert.notOk(
    result,
    'expected return to be falsey when complianceEntities are not empty and complianceType is a PurgePolicy'
  );
});
