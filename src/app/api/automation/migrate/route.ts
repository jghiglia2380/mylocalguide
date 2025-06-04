import { NextRequest, NextResponse } from 'next/server';
import { runDatabaseMigrations, checkDatabaseVersion } from '@lib/automation/db-migration';

export async function POST(request: NextRequest) {
  try {
    const { action = 'migrate' } = await request.json();

    console.log(`🔄 Database ${action} requested...`);
    
    const startTime = Date.now();
    
    let result;
    
    switch (action) {
      case 'migrate':
        result = await runDatabaseMigrations();
        break;
        
      case 'check':
        const version = checkDatabaseVersion();
        result = {
          success: true,
          version,
          changes: [`Current database version: ${version}`]
        };
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    const duration = Date.now() - startTime;

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Database ${action} completed successfully`,
        data: {
          version: result.version,
          changes: result.changes,
          duration: `${Math.round(duration / 1000)}s`,
          action
        },
        errors: result.errors
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Database ${action} failed`,
        data: {
          version: result.version,
          changes: result.changes,
          duration: `${Math.round(duration / 1000)}s`
        },
        errors: result.errors
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Database migration API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database operation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const currentVersion = checkDatabaseVersion();
    
    return NextResponse.json({
      message: 'Database migration API endpoint',
      methods: ['POST'],
      currentVersion,
      availableActions: {
        migrate: 'Run all pending database migrations',
        check: 'Check current database version without making changes'
      },
      parameters: {
        action: 'string - Action to perform: "migrate" or "check"'
      },
      migrations: {
        1: 'Add automation fields (google_place_id, yelp_id, venue_score, etc.)',
        2: 'Add SEO tables (neighborhood_content, category_content, seo_pages)',
        3: 'Add featured collections table',
        4: 'Add analytics tracking (page_views, search_queries)',
        5: 'Add search optimization (FTS5 search index)'
      },
      examples: {
        runMigrations: {
          action: 'migrate'
        },
        checkVersion: {
          action: 'check'
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check database status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}