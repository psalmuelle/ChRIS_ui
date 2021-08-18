import React, { useCallback, useEffect, useState } from "react";
import Wrapper from "../../../../containers/Layout/PageWrapper";
import {
  Grid,
  GridItem,
  EmptyState,
  EmptyStateIcon,
  Spinner,
  Title,
  Button,
  EmptyStateBody,
  EmptyStatePrimary,
} from "@patternfly/react-core";

import PFDCMClient, { PACSPatient, PFDCMFilters } from "../../../../api/pfdcm";
import QueryBuilder from "./QueryBuilder";
import QueryResults from "./QueryResults";
import { CubesIcon } from "@patternfly/react-icons";
import pluralize from "pluralize";

export enum PFDCMQueryTypes {
  PATIENT,
  DATE,
  MRN,
}

export interface PFDCMQuery {
  type: PFDCMQueryTypes
  value: any
  filters: PFDCMFilters
}

const client = new PFDCMClient;

export const PACS = () => {
	document.title = 'PACS Lookup';

  const [loading, setLoading] = useState<boolean>();
  const [results, setResults] = useState<PACSPatient[]>();
  const [_query, setLastQuery] = useState<PFDCMQuery>();
  const [PACS, setPACS] = useState<string[]>();

  useEffect(() => {
    client.getPACSservices().then((list) => {
      setPACS(list);
      if (list.length === 1)
        client.service = list.shift() as string
      else if (list.length > 1)
        client.service = list[1];
    })
  }, [])

  const StartPACSQuery = useCallback(
    async (query: PFDCMQuery) => {
      setLastQuery(query);
      setLoading(true);

      const { type, value, filters } = query;
      let response: PACSPatient[];
      switch (type) {
        case PFDCMQueryTypes.PATIENT:
          response = await client.queryByPatientName(value, filters);
          break;

        case PFDCMQueryTypes.DATE:
          response = await client.queryByStudyDate(value, filters);
          break;

        case PFDCMQueryTypes.MRN:
          response = await client.queryByPatientID(value, filters);
          break;

        default:
          throw TypeError('Unsupported PFDCM Query Type');
      }

      setResults(response);
      setLoading(false);
    },
  [])

  const onPACSSelect = (key: string) => {
    client.service = key;
  }
  
  const onPACSPull = () => {
    _query
  }

  return (
    <Wrapper>
      <article>
        <Grid hasGutter>
          <GridItem>
            <h1>PACS Lookup System</h1>
            <p></p>
          </GridItem>

          <GridItem>
            <QueryBuilder PACS={PACS} onSelectPACS={onPACSSelect} onFinalize={StartPACSQuery} />
          </GridItem>
          
          <GridItem/>

          { loading !== undefined ? (
              !loading ? (
                results ? (
                  <>
                    <GridItem>
                      <h2><b>Results</b></h2>
                      <div>{results.length} {pluralize('patient', results.length)} matched your search.</div>
                    </GridItem>

                    <GridItem>
                      <QueryResults 
                        results={results} 
                        onPull={onPACSPull} 
                      />
                    </GridItem>
                  </>
                ) : (
                  <EmptyState>
                    <EmptyStateIcon variant="container" component={CubesIcon} />
                    <Title size="lg" headingLevel="h4">
                      No results found
                    </Title>
                    <EmptyStateBody>
                      No results match the filter criteria. Clear all filters to show results.
                    </EmptyStateBody>
                    <EmptyStatePrimary>
                      <Button variant="link">Clear all filters</Button>
                    </EmptyStatePrimary>
                  </EmptyState>
                )
              ) : (
                <EmptyState>
                  <EmptyStateIcon variant="container" component={Spinner} />
                  <Title size="lg" headingLevel="h4">
                    Searching
                  </Title>
                </EmptyState>
              )
            ) : null
          }
        </Grid>
      </article>
    </Wrapper>
  )
}

export default PACS
