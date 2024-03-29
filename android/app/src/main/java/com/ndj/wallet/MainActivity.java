package com.ndj.wallet;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.facebook.react.ReactActivity;
import android.view.WindowManager;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "ndjbackpack";
  }

  @Override
    protected void onCreate(Bundle savedInstanceState) {
      super.onCreate(savedInstanceState);

      getWindow().setFlags(
              WindowManager.LayoutParams.FLAG_SECURE,
              WindowManager.LayoutParams.FLAG_SECURE
      );

      Intent intent = getIntent();
      String action = intent.getAction();
      Uri data = intent.getData();
  }
}
